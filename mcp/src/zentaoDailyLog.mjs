const TOTAL_HALF_HOUR_UNITS = 17;
const MAX_ENTRIES = 17;
const DEFAULT_MODULE = "公共基础模块";
const COMPLEXITY_KEYWORDS = ["新增", "重构", "流程", "接口", "修复"];
const ACTION_PREFIXES = /^(?:完成|新增|重构|修复|优化|实现|开发|处理|调整|补充|解决)+/u;

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/gu, " ").trim();
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
        kind: item.kind === "bug" ? "bug" : "task"
      };
    });
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

function uniqueInOrder(values) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function groupFromItem(item) {
  return {
    modules: [item.module],
    summaries: [item.completionSummary],
    topicSignatures: [topicSignature(item.title || item.completionSummary)],
    kinds: [item.kind],
    sourceItemCount: 1
  };
}

function mergeGroups(left, right) {
  return {
    modules: uniqueInOrder([...left.modules, ...right.modules]),
    summaries: [...left.summaries, ...right.summaries],
    topicSignatures: uniqueInOrder([...left.topicSignatures, ...right.topicSignatures]),
    kinds: uniqueInOrder([...left.kinds, ...right.kinds]),
    sourceItemCount: left.sourceItemCount + right.sourceItemCount
  };
}

function groupsShareTopic(left, right) {
  return left.topicSignatures.some(leftTopic =>
    right.topicSignatures.some(rightTopic => isSameTopic(leftTopic, rightTopic))
  );
}

function consolidateRelatedItems(items) {
  const groups = [];

  for (const item of items) {
    const itemGroup = groupFromItem(item);
    const matchingIndex = groups.findIndex(group =>
      group.modules.length === 1 &&
      group.modules[0] === item.module &&
      groupsShareTopic(group, itemGroup)
    );

    if (matchingIndex === -1) groups.push(itemGroup);
    else groups[matchingIndex] = mergeGroups(groups[matchingIndex], itemGroup);
  }

  return groups;
}

function modulesOverlap(left, right) {
  return left.modules.some(module => right.modules.includes(module));
}

function bestTopicSimilarity(left, right) {
  let best = 0;
  for (const leftTopic of left.topicSignatures) {
    for (const rightTopic of right.topicSignatures) {
      best = Math.max(best, topicSimilarity(leftTopic, rightTopic));
    }
  }
  return best;
}

function compareMergeCandidates(candidate, best) {
  if (candidate.moduleRank !== best.moduleRank) return candidate.moduleRank - best.moduleRank;
  if (candidate.topicScore !== best.topicScore) return candidate.topicScore - best.topicScore;
  if (candidate.sourceCount !== best.sourceCount) return best.sourceCount - candidate.sourceCount;
  if (candidate.left !== best.left) return best.left - candidate.left;
  return best.right - candidate.right;
}

function mergeToEntryLimit(initialGroups, limit) {
  const groups = [...initialGroups];

  while (groups.length > limit) {
    let best = null;
    for (let left = 0; left < groups.length - 1; left += 1) {
      for (let right = left + 1; right < groups.length; right += 1) {
        const sameModules =
          groups[left].modules.length === groups[right].modules.length &&
          groups[left].modules.every(module => groups[right].modules.includes(module));
        const candidate = {
          left,
          right,
          moduleRank: sameModules ? 2 : modulesOverlap(groups[left], groups[right]) ? 1 : 0,
          topicScore: bestTopicSimilarity(groups[left], groups[right]),
          sourceCount: groups[left].sourceItemCount + groups[right].sourceItemCount
        };
        if (best === null || compareMergeCandidates(candidate, best) > 0) best = candidate;
      }
    }

    groups[best.left] = mergeGroups(groups[best.left], groups[best.right]);
    groups.splice(best.right, 1);
  }

  return groups;
}

function consolidateItems(items, limit = MAX_ENTRIES) {
  return mergeToEntryLimit(consolidateRelatedItems(items), limit);
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
  return group.summaries.reduce((score, summary) => score + textComplexity(summary), 0);
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
    .map((share, index) => ({ index, fraction: share - Math.floor(share), score: scores[index] }))
    .sort((left, right) =>
      right.fraction - left.fraction || right.score - left.score || left.index - right.index
    );
  for (let index = 0; index < remaining; index += 1) units[remainderOrder[index].index] += 1;

  return units;
}

function representativeSummary(group) {
  let bestIndex = 0;
  let bestScore = textComplexity(group.summaries[0]);
  for (let index = 1; index < group.summaries.length; index += 1) {
    const score = textComplexity(group.summaries[index]);
    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }
  const summary = group.summaries[bestIndex];
  return group.sourceItemCount > 1 ? `${summary}等${group.sourceItemCount}项` : summary;
}

function toEntry(group, units) {
  const module = group.modules.join("、");
  const completionSummary = representativeSummary(group);
  const kinds = ["task", "bug"].filter(kind => group.kinds.includes(kind));
  return {
    module,
    completionSummary,
    description: `${module}：${completionSummary}`,
    kind: kinds.length === 1 ? kinds[0] : "mixed",
    kinds,
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
  const date = beijingDate(options.now ?? new Date());
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
