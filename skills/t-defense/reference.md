# 防御性编程分语言参考

各语言只是语法工具，可信/不可信边界的决策逻辑完全通用。

## 目录

- [TypeScript / JavaScript](#typescript--javascript)
- [Python](#python)
- [Java](#java)
- [Go](#go)
- [Rust](#rust)
- [C#](#csharp)
- [推荐校验库汇总](#推荐校验库汇总)

## TypeScript / JavaScript

TS 仅编译期有效；`JSON.parse`、网络、`localStorage` 全部不受 TS 保护。可信域信任 TS，不到处 `if (!x)`、不滥用 `?.`；不可信边界（接口、存储、`JSON.parse`、`postMessage`）用 Zod / Valibot 做 schema 校验。

```ts
// ❌ 坏：可信域过度防御，且静默返回 0 掩盖问题
function calcPrice(good: { price: number }) {
  if (!good) return 0;
  if (typeof good.price !== "number") return 0;
  return good.price * 1.2;
}

// ✅ 好：可信域交给 TS
function calcPrice(good: { price: number }) {
  return good.price * 1.2;
}

// ❌ 坏：不可信边界直接 as 强转欺骗编译器
const data = (await resp.json()) as Goods;

// ✅ 好：不可信边界用 schema 校验，失败记日志并显式报错
const res = GoodsSchema.safeParse(raw);
if (!res.success) {
  console.error("数据格式错误", res.error);
  throw new Error("非法数据");
}
```

## Python

动态类型；类型注解仅 IDE/MyPy 静态检查，运行时无约束。可信域依赖 mypy，不每处 `isinstance`；不可信边界（`json.loads`、HTTP、数据库返回、命令行参数）用 Pydantic v2 运行时校验。

```python
from pydantic import BaseModel

class Goods(BaseModel):
    price: int

# ❌ 过度防御：可信域内部反复 isinstance，且静默返回 0
def calc_price(good: Goods) -> float:
    if not isinstance(good, Goods):
        return 0
    if not isinstance(good.price, int):
        return 0
    return good.price * 1.2

# ✅ 可信域：信任类型注解 + mypy
def calc_price(good: Goods) -> float:
    return good.price * 1.2

# ❌ 坏：json.loads 结果直接当模型用，注解只是提示
raw = json.loads(body)
data: Goods = raw

# ✅ 不可信边界：Pydantic 运行时解析校验
data = Goods.model_validate(raw)
```

> `assert` 在生产环境 `-O` 优化模式下会被移除，不能用于校验外部输入。

## Java

编译期强类型；但 Jackson/Gson 反序列化可产生字段为 null 的对象，编译期约束失效。可信域信任编译类型；不可信边界（反序列化、http body、结果集）用 Bean Validation（JSR-380 / Hibernate Validator）。

```java
// ❌ 过度防御：内部方法无脑 instanceof + 判空后静默返回 0
public static double calcPrice(Goods good) {
    if (!(good instanceof Goods)) return 0;
    if (good.getPrice() == null) return 0;
    return good.getPrice() * 1.2;
}

// ✅ 可信域：信任编译期类型
public static double calcPrice(Goods good) {
    return good.getPrice() * 1.2;
}

// ❌ 坏：反序列化裸奔
Goods data = objectMapper.readValue(body, Goods.class);

// ✅ 不可信边界：反序列化后开启 validation 校验
Set<ConstraintViolation<Goods>> violations = validator.validate(data);
if (!violations.isEmpty()) {
    // 记日志、抛出
}
```

## Go

静态编译；struct 只是内存结构，`json.Unmarshal` 对缺失字段静默填零值，不报错——很容易把非法输入当合法零值。可信域信任编译类型；不可信边界用 `go-playground/validator`。

```go
type Goods struct {
	Price int `json:"price" validate:"required,min=0"`
}

// ❌ 坏：用零值判断区分"本来就是 0"和"json 缺失"，做不到且静默返回 0
func CalcPrice(good Goods) float64 {
	if good.Price == 0 {
		return 0
	}
	return float64(good.Price) * 1.2
}

// ✅ 可信域：包内信任编译类型
func CalcPrice(good Goods) float64 {
	return float64(good.Price) * 1.2
}

// ❌ 坏：直接 unmarshal，缺失字段静默填零值
_ = json.Unmarshal(body, &good)

// ✅ 不可信边界：unmarshal + validator 校验
if err := json.Unmarshal(body, &good); err != nil {
	return err
}
if err := validator.Struct(&good); err != nil {
	return err
}
```

## Rust

编译期保证所有权与类型安全，但只防内存错误，不防业务上非法的外部数据。可信域交给编译器；非法业务状态用构造函数（`new` → `Result`）在边界收口；不可信边界 serde 反序列化 + validator crate。

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Goods {
    price: i32,
}

// ❌ 坏：发现非法业务状态却静默返回 0.0，掩盖问题
fn calc_price(good: &Goods) -> f64 {
    if good.price < 0 {
        return 0.0;
    }
    good.price as f64 * 1.2
}

// ✅ 可信域：编译期已保证类型；业务合法性在边界用构造函数收口
fn calc_price(good: &Goods) -> f64 {
    good.price as f64 * 1.2
}

// ❌ 坏：反序列化后不做业务字段校验
let good: Goods = serde_json::from_slice(&body)?;

// ✅ 不可信边界：反序列化 + 业务校验，非法数据显式报错
let good: Goods = serde_json::from_slice(&body)?;
if good.price < 0 {
    return Err(anyhow::anyhow!("price 不能为负"));
}
```

<a id="csharp"></a>

## C#

编译强类型；Newtonsoft.Json / System.Text.Json 反序列化可产生字段 null/default。可信域信任编译期类型；不可信边界用 DataAnnotations 校验。

```csharp
public class Goods
{
    public int Price { get; set; }
}

// ❌ 过度防御：内部方法无脑判空判默认值并静默返回 0
public static double CalcPrice(Goods good)
{
    if (good == null) return 0;
    if (good.Price <= 0) return 0;
    return good.Price * 1.2;
}

// ✅ 可信域：信任编译期类型
public static double CalcPrice(Goods good)
{
    return good.Price * 1.2;
}

// ✅ 不可信边界：反序列化后做 DataAnnotations 校验
var validationContext = new ValidationContext(good);
Validator.ValidateObject(good, validationContext, true);
```

## 推荐校验库汇总

| 语言 | 结构化校验库 | 用途 |
| --- | --- | --- |
| TS/JS | Zod / Valibot | 边界 schema 校验 |
| Python | Pydantic v2 | 数据模型运行时校验 |
| Java | Hibernate Validator（JSR-380） | Bean 校验 |
| Go | go-playground/validator | struct tag 校验 |
| Rust | serde + validator | 反序列化 + 业务校验 |
| C# | DataAnnotations | 模型校验 |
