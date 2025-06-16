/*
 * @Author: taojinchao
 * @Date: 2025-05-14 20:20:36
 * @LastEditors: taojinchao
 * @LastEditTime: 2025-06-12 14:54:50
 * @Description: 从源码中提取出指定行数的源码
 */
let reqParams = {
  body: {
    data: {
      bizTreeName: "khweb-moni-ai-steward",
      programBuildVersion: "20250610195422.songyuhang.19070ace.541.release-202",
      list: [
        {
          originalLine: 1,
          originalColumn: 15404,
          originalPath:
            "webpack:///node_modules/@king-fisher/falcon/lib/es/web/index.js",
          originalName: "success",
          originalSource:
            "import e from\\\"@king-fisher/bridge/lib/es/web/index\\\";var n=function(e,t){return n=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,n){e.__proto__=n}||function(e,n){for(var t in n)Object.prototype.hasOwnProperty.call(n,t)&&(e[t]=n[t])},n(e,t)};function t(e,t){if(\\\"function\\\"!=typeof t&&null!==t)throw new TypeError(\\\"Classextendsvalue\\\"+String(t)+\\\"isnotaconstructorornull\\\");function o(){this.constructor=e}n(e,t),e.prototype=null===t?Object.create(t):(o.prototype=t.prototype,new o)}var o,c=function(){return c=Object.assign||function(e){for(var n             profitRate: '',\\n              todayProfit: '',\\n              todayProfitRate: '',\\n            };\\n            window.console.log(error, 'handleStoockResError');\\n          }\\n          stockData[item.stockCode] = tmp;\\n        });\\n        success(stockData);\\n      },\\n      fail: res => {\\n        fail(res);\\n      },\\n    });\\n  }\\n  cancelGetQuotations() {\\n    cancelQuotation();\\n  }\\n}\\n",
          sourceFilePath: "chunk-common.b299601b.js",
        },
      ],
    },
    status_code: 0,
    status_msg: "请求成功",
  },
  logs: [
    {
      service: "kaihu-moni_khweb-moni-ai-fusion-robot",
      message:
        "Uncaught TypeError: Cannot read properties of undefined (reading 'success')",
      category: "js",
      log_time: 1749114963597,
      stack:
        "TypeError: Cannot read properties of undefined (reading 'success')\n    at callback (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:866278)\n    at <anonymous>:1:12",
      errorUrl:
        "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js",
    },
    {
      service: "kaihu-moni_khweb-moni-ai-fusion-robot",
      message:
        "Uncaught TypeError: Cannot read properties of undefined (reading '10')",
      category: "js",
      log_time: 1749115067054,
      stack:
        "TypeError: Cannot read properties of undefined (reading '10')\n at <anonymous>:1:12",
      errorUrl:
        "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-common.b299601b.js",
    },
    {
      service: "kaihu-moni_khweb-moni-ai-fusion-robot",
      message:
        "Uncaught TypeError: Cannot read properties of undefined (reading 'success')",
      category: "js",
      log_time: 1749114893893,
      stack:
        "TypeError: Cannot read properties of undefined (reading 'success')\n   at callback (https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js:37:866278)\n    at <anonymous>:1:12",
      errorUrl:
        "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-vendors.ac2ba38b.js",
    },
    {
      service: "kaihu-moni_khweb-moni-ai-fusion-robot",
      message:
        "Uncaught TypeError: Cannot read properties of undefined (reading '10')",
      category: "js",
      log_time: 1749114604889,
      stack:
        "TypeError: Cannot read properties of undefined (reading '10')\n   at <anonymous>:1:12",
      errorUrl:
        "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-common.b299601b.js",
    },
    {
      service: "kaihu-moni_khweb-moni-ai-fusion-robot",
      message:
        "Uncaught TypeError: Cannot read properties of undefined (reading '10')",
      category: "js",
      log_time: 1749114444386,
      stack:
        "TypeError: Cannot read properties of undefined (reading '10')\n  at <anonymous>:1:12",
      errorUrl:
        "https://s.thsi.cn/cd/khweb-moni-ai-steward/js/chunk-common.b299601b.js",
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
      log.errorUrl.includes(item.sourceFilePath)
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

function testMain() {
  reqParams.body = JSON.stringify(reqParams.body);
  // reqParams.logs = JSON.stringify(reqParams.logs);
  console.log(main(reqParams));
}
testMain();
