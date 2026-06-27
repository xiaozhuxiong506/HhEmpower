const TOTAL_HALF_HOUR_UNITS = 17;
const MAX_ENTRIES = 17;
const DEFAULT_MODULE = "公共基础模块";
const COMPLEXITY_KEYWORDS = ["新增", "重构", "流程", "接口", "修复"];
const ACTION_PREFIXES = /^(?:完成|新增|重构|修复|优化|实现|开发|处理|调整|补充|解决)+/u;

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function normalizeCompletedItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .filter(item => item?.completed === true && item?.verified === true)
    .map(item => {
      const title = normalizeText(item.title);
      const providedSummary = normalizeText(item.completionSummary);
      return {
        module: normalizeText(item.module) || DEFAULT_MODULE,
        title,
        completionSummary: providedSummary || title,
        kind: item.kind === "bug" ? "bug" : "task",
        topic: topicSignature(title || providedSummary)
      };
    })
    .filter(item => item.completionSummary)
    .sort((left, right) => compareText(itemKey(left), itemKey(right)));
}

function resolveNow(value) {
  const now = value === undefined
    ? new Date()
    : value instanceof Date
      ? value
      : new Date(value);
  if (!Number.isFinite(now.getTime())) {
    throw new TypeError("options.now must be a valid date");
  }
  return now;
}

function beijingDate(now) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function topicSignature(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(ACTION_PREFIXES, "")
    .replace(/[0-9０-９]+$/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function commonPrefixLength(left, right) {
  const leftCharacters = Array.from(left);
  const rightCharacters = Array.from(right);
  const limit = Math.min(leftCharacters.length, rightCharacters.length);
  let length = 0;
  while (length < limit && leftCharacters[length] === rightCharacters[length]) length += 1;
  return length;
}

function topicSimilarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1000 + Array.from(left).length;
  const shorterLength = Math.min(Array.from(left).length, Array.from(right).length);
  if (shorterLength >= 4 && (left.includes(right) || right.includes(left))) return 500 + shorterLength;
  return commonPrefixLength(left, right);
}

function isSameTopic(left, right) {
  const shorterLength = Math.min(Array.from(left).length, Array.from(right).length);
  if (shorterLength === 0) return false;
  const similarity = topicSimilarity(left, right);
  if (similarity >= 500) return true;
  return similarity >= Math.min(6, Math.ceil(shorterLength * 0.6));
}

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function itemKey(item) {
  return JSON.stringify([
    item.module,
    item.topic,
    item.title,
    item.completionSummary,
    item.kind
  ]);
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort(compareText);
}

function outcomeKey(outcome) {
  return JSON.stringify([outcome.module, outcome.summary]);
}

function uniqueOutcomes(outcomes) {
  const byKey = new Map();
  for (const outcome of outcomes) {
    const key = outcomeKey(outcome);
    if (!byKey.has(key)) byKey.set(key, outcome);
  }
  return Array.from(byKey.values()).sort((left, right) =>
    compareText(outcomeKey(left), outcomeKey(right))
  );
}

function orderedKinds(kinds) {
  return ["task", "bug"].filter(kind => kinds.includes(kind));
}

function groupFromItems(items) {
  return {
    modules: uniqueSorted(items.map(item => item.module)),
    outcomes: uniqueOutcomes(items.map(item => ({
      module: item.module,
      summary: item.completionSummary
    }))),
    topics: uniqueSorted(items.map(item => item.topic)),
    kinds: orderedKinds(items.map(item => item.kind)),
    sourceItemCount: items.length
  };
}

function groupKey(group) {
  return JSON.stringify([
    group.modules,
    group.topics,
    group.outcomes.map(outcome => [outcome.module, outcome.summary]),
    group.kinds,
    group.sourceItemCount
  ]);
}

function mergeGroupList(groups) {
  return {
    modules: uniqueSorted(groups.flatMap(group => group.modules)),
    outcomes: uniqueOutcomes(groups.flatMap(group => group.outcomes)),
    topics: uniqueSorted(groups.flatMap(group => group.topics)),
    kinds: orderedKinds(groups.flatMap(group => group.kinds)),
    sourceItemCount: groups.reduce((total, group) => total + group.sourceItemCount, 0)
  };
}

function connectedTopicGroups(items) {
  const parents = items.map((_, index) => index);
  const find = index => {
    let root = index;
    while (parents[root] !== root) root = parents[root];
    while (parents[index] !== index) {
      const parent = parents[index];
      parents[index] = root;
      index = parent;
    }
    return root;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot === rightRoot) return;
    parents[Math.max(leftRoot, rightRoot)] = Math.min(leftRoot, rightRoot);
  };
  const indexesByModule = new Map();
  for (let index = 0; index < items.length; index += 1) {
    const indexes = indexesByModule.get(items[index].module) || [];
    indexes.push(index);
    indexesByModule.set(items[index].module, indexes);
  }

  for (const indexes of indexesByModule.values()) {
    for (let left = 0; left < indexes.length - 1; left += 1) {
      for (let right = left + 1; right < indexes.length; right += 1) {
        if (isSameTopic(items[indexes[left]].topic, items[indexes[right]].topic)) {
          union(indexes[left], indexes[right]);
        }
      }
    }
  }

  const components = new Map();
  for (let index = 0; index < items.length; index += 1) {
    const root = find(index);
    const component = components.get(root) || [];
    component.push(items[index]);
    components.set(root, component);
  }
  return Array.from(components.values())
    .map(groupFromItems)
    .sort((left, right) => compareText(groupKey(left), groupKey(right)));
}

function compressToEntryLimit(groups, limit) {
  if (groups.length <= limit) return groups;
  const buckets = Array.from({ length: limit }, () => []);
  for (let index = 0; index < groups.length; index += 1) {
    const bucketIndex = Math.floor(index * limit / groups.length);
    buckets[bucketIndex].push(groups[index]);
  }
  return buckets.map(mergeGroupList);
}

function consolidateItems(items, limit = MAX_ENTRIES) {
  return compressToEntryLimit(connectedTopicGroups(items), limit);
}

function textComplexity(text) {
  const normalized = normalizeText(text);
  const keywordScore = COMPLEXITY_KEYWORDS.reduce(
    (score, keyword) => score + (normalized.includes(keyword) ? 8 : 0),
    0
  );
  return Math.max(1, Array.from(normalized).length + keywordScore);
}

function groupComplexity(group) {
  return group.outcomes.reduce((score, outcome) => score + textComplexity(outcome.summary), 0);
}

function allocateHalfHourUnits(groups, totalUnits = TOTAL_HALF_HOUR_UNITS) {
  const units = groups.map(() => 1);
  let remaining = totalUnits - groups.length;
  if (remaining <= 0) return units;

  const scores = groups.map(groupComplexity);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const shares = scores.map(score => remaining * score / totalScore);
  const additionalUnits = shares.map(Math.floor);
  for (let index = 0; index < units.length; index += 1) units[index] += additionalUnits[index];
  remaining -= additionalUnits.reduce((sum, value) => sum + value, 0);

  const remainderOrder = shares
    .map((share, index) => ({
      index,
      fraction: share - Math.floor(share),
      score: scores[index],
      key: groupKey(groups[index])
    }))
    .sort((left, right) =>
      right.fraction - left.fraction ||
      right.score - left.score ||
      compareText(left.key, right.key)
    );
  for (let index = 0; index < remaining; index += 1) units[remainderOrder[index].index] += 1;

  return units;
}

function describeOutcomes(group) {
  if (group.modules.length === 1) {
    return `${group.modules[0]}：${group.outcomes.map(outcome => outcome.summary).join("；")}`;
  }
  return group.outcomes
    .map(outcome => `${outcome.module}：${outcome.summary}`)
    .join("；");
}

function toEntry(group, units) {
  const module = group.modules.join("、");
  return {
    module,
    completionSummary: group.outcomes.map(outcome => outcome.summary).join("；"),
    description: describeOutcomes(group),
    outcomes: group.outcomes,
    kinds: group.kinds,
    sourceItemCount: group.sourceItemCount,
    hours: units / 2
  };
}

function summaryForKinds(kinds) {
  const hasTasks = kinds.includes("task");
  const hasBugs = kinds.includes("bug");
  if (hasTasks && hasBugs) return "总结：日常任务及Bug开发";
  if (hasBugs) return "总结：日常Bug修复";
  return "总结：日常任务开发";
}

function formatHours(hours) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

function formatDailyLog(date, entries, summary) {
  return [
    `${date} 完成事项`,
    ...entries.map((entry, index) => `${index + 1}.${entry.description} ${formatHours(entry.hours)}`),
    summary
  ].join("\n");
}

export function generateZentaoDailyLog(items, options = {}) {
  const completedItems = normalizeCompletedItems(items);
  if (completedItems.length === 0) {
    return {
      canGenerate: false,
      sourceItemCount: 0,
      entries: [],
      totalHours: 0,
      markdown: ""
    };
  }

  const consolidated = consolidateItems(completedItems);
  const units = allocateHalfHourUnits(consolidated);
  const entries = consolidated.map((group, index) => toEntry(group, units[index]));
  const safeOptions = options && typeof options === "object" ? options : {};
  const date = beijingDate(resolveNow(safeOptions.now));
  const summary = summaryForKinds(consolidated.flatMap(group => group.kinds));

  return {
    canGenerate: true,
    date,
    sourceItemCount: completedItems.length,
    entries,
    totalHours: entries.reduce((total, entry) => total + entry.hours, 0),
    markdown: formatDailyLog(date, entries, summary)
  };
}
