/*
 * @Author: taojinchao
 * @Date: 2025-05-14 21:14:58
 * @LastEditors: taojinchao
 * @LastEditTime: 2025-06-20 09:56:50
 * @Description: 存在源码处理
 */
const logs = [
  {
    service: "kaihu-moni_khweb-moni-ai-fusion-robot",
    message:
      "Uncaught TypeError: Cannot read properties of undefined (reading 'success')",
    category: "js",
    log_time: 1749114713323,
    stack:
      "TypeError: Cannot read properties of undefined (reading 'success')\n    at n.callInstanceMethod (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:1194403)\n    at n.abort (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:1194233)\n    at success (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/aiFusionRobot.c705e77a.js:1:49996)\n    at w (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:1182564)\n    at https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:1194535\n    at callback (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:866278)\n    at <anonymous>:1:12",
    errorUrl:
      "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js",
  },
  {
    service: "kaihu-moni_khweb-moni-ai-fusion-robot",
    message:
      "Uncaught TypeError: Cannot read properties of undefined (reading '10')",
    category: "js",
    log_time: 1749114404307,
    stack:
      "TypeError: Cannot read properties of undefined (reading '10')\n    at t.value (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-common.b299601b.js:1:313893)\n    at success (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-common.b299601b.js:1:314263)\n    at success (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:921821)\n    at V (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:874958)\n    at https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:886929\n    at callback (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:866278)\n    at <anonymous>:1:12",
    errorUrl:
      "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-common.b299601b.js",
  },
];

const body = {
  list: [
    {
      originalLine: 1,
      originalColumn: 15404,
      originalPath: "webpack;",
      sourceFilePath:
        "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js",
    },
    {
      originalLine: 172,
      originalColumn: 37,
      originalPath: "webpack:///src/pages/aiStrategy/utils/getStockData.ts",
      originalName: "MainStationFiled",
      originalSource:
        "import B\nstockData[item.stockCode] = tmp;\n      }\n}\n",
      sourceFilePath:
        "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js",
    },
  ],
};

function extractSourceByLine(source, line, context = 20) {
  const lines = source.split("\n");
  const start = Math.max(0, line - context - 1);
  const end = Math.min(lines.length, line + context);
  return lines.slice(start, end).join("\n");
}

function main({ body, logs }) {
  const {
    data: { bizTreeName, programBuildVersion, list = [] },
  } = JSON.parse(body);

  // 为每个 log 添加 hasSourceMap 标识
  const newLogs = logs.map((log) => {
    const hasSourceMap = list.some((item) =>
      log.stack?.includes(item.sourceFilePath)
    );
    log.hasSourceMap = hasSourceMap;
    return log;
  });

  // 处理每个错误项，提取源码上下文
  const errorList = list.map((item) => {
    if (item.originalSource) {
      item.originalSource = extractSourceByLine(
        item.originalSource,
        item.originalLine,
        20
      );
    }
    return item;
  });

  let sourceCodeQuery = errorList
    .map(
      (item) =>
        `${item.originalPath}:${item.originalLine}:${item.originalColumn} 的源码为: ${item.originalSource}; `
    )
    .join("\n");

  if (sourceCodeQuery) {
    sourceCodeQuery = `错误堆栈中涉及的资源文件，其中 ${sourceCodeQuery}。`;
  }

  return { bizTreeName, programBuildVersion, newLogs, sourceCodeQuery };
}
