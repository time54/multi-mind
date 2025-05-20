// 1. http请求：ELK日志
const elkLog = {
  data: {
    took: 53,
    timed_out: false,
    _shards: {
      total: 426,
      successful: 426,
      skipped: 416,
      failed: 0,
    },
    hits: {
      total: {
        value: 1,
        relation: "eq",
      },
      max_score: 20.744162,
      hits: [
        {
          _index: "mobile-archive-am-skywalking-log-json-20250514",
          _type: "_doc",
          _id: "8UkLzpYBwRx0iFQm1-qG",
          _score: 20.744162,
          _routing: "HIoLzpYBudMJkM142dEU",
          _source: {
            host_ip: "10.240.9.38",
            uniqueId: "ca0a67fd-820b-462b-b585-e3acb2c3e3b1",
            service: "kernel-kingfisher-collector",
            serviceVersion: "sw-local-to-elk-0120-sendBeacon",
            group: "local-test-1",
            subGroup: "sub-group",
            pagePath: "/asd/asd",
            domain: "127.0.0.1:5500",
            sdkVersion: "v1.1.22",
            log_time: 1747213572463,
            category: "ajax",
            grade: "Error",
            errorUrl: "Error",
            message: "我是主动抛出的异常, 设置 1s 后上报",
            stack:
              "Error: 我是主动抛出的异常, 设置 1s 后上报\n    at reportFrameFn (http://127.0.0.1:5500/js/index-ejeTtfZz.js:1:3651)\n    at yt (http://127.0.0.1:5500/js/vendor-BnVSkXQ8.js:13:38)\n    at ve (http://127.0.0.1:5500/js/vendor-BnVSkXQ8.js:13:108)\n    at HTMLButtonElement.s (http://127.0.0.1:5500/js/vendor-BnVSkXQ8.js:17:4000)",
            level: 1,
            content: "我是上下文信息",
            userid: "602979913",
            os: "iPhone",
            osVersion: "12_0",
            UA: "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 Language/zh-Hans hxFont/normal hxnoimage/0 VoiceAssistantVer/3101 hxtheme/0 IHexin/10.50.30 (Royal Flush) userid/602979913 innerversion/IZ037.08.380 iPhoneTargetType/hexinPro build/10.50.30",
            groupedPagePath: "http://127.0.0.1:5500/asd/asd",
            "x-real-ip": "121.52.252.23",
            pod: "",
            elk_country: "中国",
            elk_region: "CN",
            elk_province: "浙江省",
            elk_city: "杭州市",
            elk_isp: "中国联通",
            elk_category: "普通机房",
            indexTime: 1747213597377,
            elkIndexTime: 1747213605140,
          },
        },
      ],
    },
  },
  status_code: 0,
  status_msg: "请求成功",
};

// 2. 从响应结果中提取ELK日志
function main({ arg1 }) {
  const {
    data: {
      hits: { hits },
    },
  } = JSON.parse(arg1);
  return {
    hits,
    logTotals: hits.length,
  };
}

// 3.清洗日志: 过滤“Script error.”
function main({ list }) {
  const newList = [];
  list.forEach((item) => {
    if (!item?._source) return;

    const { message } = item._source;
    if (message !== "Script error.") {
      const { service, category, log_time, stack, errorUrl } = item._source;
      newList.push({ service, message, category, log_time, stack, errorUrl });
    }
  });

  return {
    logs: newList,
    logTotals: newList.length,
  };
}

function parseStack2(stack) {
  if (!stack || typeof stack !== "string") {
    return null;
  }

  const lines = stack.split("\n");
  const startIndex =
    lines[0].startsWith("TypeError:") || lines[0].startsWith("Error:") ? 1 : 0;
  // const regex = /at\s+(?:[^\s]+\s+)?\(?([^\s\(\)]+)(?::(\d+):(\d+))?\)?/;
  const regex = /(?:@)(https:\/\/[^:]+):(\d+):(\d+)/;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const match = regex.exec(line);

    if (match) {
      let [_, file, lineNum, column] = match;

      if (!lineNum && !column) {
        const fileMatch = file.match(/(.+?):(\d+):(\d+)$/);
        if (fileMatch) {
          [_, file, lineNum, column] = fileMatch;
        }
      }

      let sourceFilePath;

      if (file) {
        const pathArr = file.split("/");
        sourceFilePath = pathArr[pathArr.length - 1];

        return {
          file,
          sourceFilePath,
          line: lineNum ? parseInt(lineNum, 10) : undefined,
          column: column ? parseInt(column, 10) : undefined,
        };
      }
    }
  }

  return null;
}

// 4. 从堆栈中获取行列信息
function parseStack(stack) {
  if (!stack || typeof stack !== "string") {
    return null;
  }

  const lines = stack.split("\n");
  const startIndex =
    lines[0].startsWith("TypeError:") || lines[0].startsWith("Error:") ? 1 : 0;

  // Let's log each line to see what we're working with
  console.log("Stack lines:", lines);

  // This regex specifically matches the format in the example: at functionName (http://domain/path:line:column)
  const regex =
    /at\s+([^\s\(]+)\s*\(?(http[s]?:\/\/[^:]+:[^:]+):(\d+):(\d+)\)?/;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    console.log(`Processing line ${i}:`, line);

    const match = regex.exec(line);
    console.log("Match result:", match);

    if (match) {
      // The function name is in group 1, file URL in group 2, line in group 3, column in group 4
      let [_, functionName, file, lineNum, column] = match;
      console.log("Extracted:", { functionName, file, lineNum, column });

      let sourceFilePath;

      if (file) {
        const pathArr = file.split("/");
        sourceFilePath = pathArr[pathArr.length - 1];

        return {
          file,
          sourceFilePath,
          line: lineNum ? parseInt(lineNum, 10) : undefined,
          column: column ? parseInt(column, 10) : undefined,
          functionName: functionName ? functionName.trim() : undefined,
        };
      }
    }
  }

  // If we didn't find a match with the first regex, try a simpler one that just looks for URLs
  console.log("No match found with first regex, trying simpler approach");
  const simpleRegex = /(http[s]?:\/\/[^:]+:[^:]+):(\d+):(\d+)/;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const match = simpleRegex.exec(line);
    console.log("Simple regex match:", match);

    if (match) {
      let [_, file, lineNum, column] = match;
      console.log("Simple regex extracted:", { file, lineNum, column });

      let sourceFilePath;

      if (file) {
        const pathArr = file.split("/");
        sourceFilePath = pathArr[pathArr.length - 1];

        return {
          file,
          sourceFilePath,
          line: lineNum ? parseInt(lineNum, 10) : undefined,
          column: column ? parseInt(column, 10) : undefined,
        };
      }
    }
  }

  return null;
}

function main({ logs }) {
  const stackList = [];
  const record = [];
  logs.forEach((item) => {
    const { stack } = item;
    if (!stack) return;

    const stackInfo = parseStack(stack);
    if (stackInfo) {
      const { file, line, column } = stackInfo;
      if (!file || !line || !column) return;

      const key = `${file}_${line}_${column}`;
      if (record.includes(key)) return;

      record.push(key);
      stackList.push(stackInfo);
    }
  });

  return {
    stackList,
    stackStr: JSON.stringify(stackList),
  };
}

// 堆栈信息输出
const stackList = {
  stackList: [
    {
      file: "http://127.0.0.1:5500/js/index-ejeTtfZz.js",
      sourceFilePath: "index-ejeTtfZz.js",
      line: 1,
      column: 3651,
      functionName: "reportFrameFn",
    },
  ],
  stackStr:
    '[{"file":"http://127.0.0.1:5500/js/index-ejeTtfZz.js","sourceFilePath":"index-ejeTtfZz.js","line":1,"column":3651,"functionName":"reportFrameFn"}]',
};

// 5. https请求：根据堆栈信息获取源码片段
const yuanma = {
  status_code: 201,
  body: '{"data":{"bizTreeName":"kingfisher-analyze-container","programBuildVersion":"20250514161642.wangyifan.f1566b04.169.tjc-20250514","list":[{"originalLine":150,"originalColumn":10,"originalPath":"../../src/components/ErrorPage.vue","originalName":null,"originalSource":"<template>\\n  <div class=\\"error-page\\">\\n    <div class=\\"error-section\\">\\n      <h2>JavaScript 错误示例</h2>\\n      <div class=\\"error-buttons\\">\\n        <button @click=\\"triggerSyntaxError\\" class=\\"error-btn\\">\\n          SyntaxError\\n        </button>\\n        <button @click=\\"triggerReferenceError\\" class=\\"error-btn\\">\\n          ReferenceError\\n        </button>\\n        <button @click=\\"triggerTypeError\\" class=\\"error-btn\\">TypeError</button>\\n        <button @click=\\"triggerRangeError\\" class=\\"error-btn\\">RangeError</button>\\n      </div>\\n    </div>\\n\\n    <div class=\\"error-section\\">\\n      <h2>网络错误示例</h2>\\n      <div class=\\"error-buttons\\">\\n        <button @click=\\"triggerClientError\\" class=\\"error-btn\\">\\n          客户端错误 (404)\\n        </button>\\n        <button @click=\\"triggerServerError\\" class=\\"error-btn\\">\\n          服务器错误 (500)\\n        </button>\\n        <button @click=\\"triggerNetworkConnectionError\\" class=\\"error-btn\\">\\n          网络连接错误\\n        </button>\\n        <button @click=\\"triggerBlockedRequest\\" class=\\"error-btn\\">\\n          请求被阻止\\n        </button>\\n        <button @click=\\"triggerParseError\\" class=\\"error-btn\\">\\n          数据解析错误\\n        </button>\\n      </div>\\n    </div>\\n    <div class=\\"error-section\\">\\n      <h2>主动上报</h2>\\n      <div class=\\"error-buttons\\">\\n        <button @click=\\"reportFrameFn\\" class=\\"error-btn\\">主动上报异常</button>\\n        <button @click=\\"reportTti\\" class=\\"error-btn\\">主动上报性能-tti</button>\\n        <button @click=\\"reportLcp\\" class=\\"error-btn\\">主动上报性能-lcp</button>\\n      </div>\\n    </div>\\n  </div>\\n</template>\\n\\n<script setup lang=\\"ts\\">\\n// 声明全局 ClientMonitor 接口\\ndeclare global {\\n  interface Window {\\n    ClientMonitor: {\\n      reportFrameErrors: (context: any, error: Error) => void;\\n      setPerformanceData: (context: any, data: any) => void;\\n    };\\n  }\\n}\\n\\n// SyntaxError: 语法错误示例\\nconst triggerSyntaxError = () => {\\n  // 语法错误的代码：缺少右括号\\n  eval(\\"function test() { console.log(\'test\'\\");\\n};\\n\\n// ReferenceError: 引用未定义变量示例\\nconst triggerReferenceError = () => {\\n  // 引用一个未定义的变量\\n  // @ts-ignore - 故意触发 ReferenceError\\n  console.log(nonExistentVariable);\\n};\\n\\n// TypeError: 类型错误示例\\nconst triggerTypeError = () => {\\n  // 尝试调用一个数字的方法\\n  const num = 123;\\n  // @ts-ignore - 故意触发 TypeError\\n  num.toUpperCase();\\n};\\n\\n// RangeError: 数值越界示例\\nconst triggerRangeError = () => {\\n  // 创建一个超出最大长度的数组\\n  new Array(-1);\\n};\\n\\n// 客户端错误示例 (404 Not Found)\\nconst triggerClientError = async () => {\\n  const response = await fetch(\\"https://api.example.com/nonexistent\\");\\n  if (!response.ok) {\\n    throw new Error(`客户端错误: ${response.status} ${response.statusText}`);\\n  }\\n};\\n\\n// 服务器错误示例 (500 Internal Server Error)\\nconst triggerServerError = async () => {\\n  const response = await fetch(\\"https://httpstat.us/500\\");\\n  if (!response.ok) {\\n    throw new Error(`服务器错误: ${response.status} ${response.statusText}`);\\n  }\\n};\\n\\n// 网络连接错误示例\\nconst triggerNetworkConnectionError = async () => {\\n  try {\\n    // 尝试连接到一个不存在的域名\\n    await fetch(\\"https://this-domain-does-not-exist.example\\");\\n  } catch (error: unknown) {\\n    if (error instanceof Error) {\\n      throw new Error(`网络连接错误: ${error.message}`);\\n    }\\n    throw new Error(\\"未知网络错误\\");\\n  }\\n};\\n\\n// 请求被阻止示例\\nconst triggerBlockedRequest = async () => {\\n  try {\\n    // 尝试访问一个被 CORS 策略阻止的 API\\n    await fetch(\\"https://api.example.com/data\\", {\\n      mode: \\"cors\\",\\n      headers: {\\n        Origin: \\"https://different-origin.com\\",\\n      },\\n    });\\n  } catch (error: unknown) {\\n    if (error instanceof Error) {\\n      throw new Error(`请求被阻止: ${error.message}`);\\n    }\\n    throw new Error(\\"未知请求错误\\");\\n  }\\n};\\n\\n// 数据解析错误示例\\nconst triggerParseError = async () => {\\n  try {\\n    const response = await fetch(\\"https://api.example.com/invalid-json\\");\\n    const text = await response.text();\\n    // 尝试解析无效的 JSON 数据\\n    JSON.parse(text);\\n  } catch (error: unknown) {\\n    if (error instanceof Error) {\\n      throw new Error(`数据解析错误: ${error.message}`);\\n    }\\n    throw new Error(\\"未知解析错误\\");\\n  }\\n};\\n\\nconst reportFrameFn = () => {\\n  try {\\n    throw new Error(\\"我是主动抛出的异常, 设置 1s 后上报\\");\\n  } catch (err) {\\n    console.log(err);\\n    window.ClientMonitor.reportFrameErrors(\\n      {\\n        category: \\"ajax\\",\\n        content: \\"我是上下文信息\\",\\n        level: 1,\\n      },\\n      err as Error\\n    );\\n  }\\n};\\n\\nconst reportTti = () => {\\n  window.ClientMonitor.setPerformanceData({}, { ttiTime: 54321 });\\n};\\n\\nconst reportLcp = () => {\\n  window.ClientMonitor.setPerformanceData({}, { lcpTime: 1234 });\\n};\\n</script>\\n\\n<style scoped>\\n.error-page {\\n  padding: 2rem;\\n  text-align: center;\\n}\\n\\n.error-section {\\n  margin-bottom: 3rem;\\n  padding: 2rem;\\n  border: 1px solid #eee;\\n  border-radius: 8px;\\n  background-color: #fafafa;\\n}\\n\\n.error-section h2 {\\n  margin-bottom: 1.5rem;\\n  color: #333;\\n}\\n\\n.error-buttons {\\n  display: flex;\\n  gap: 1rem;\\n  justify-content: center;\\n  flex-wrap: wrap;\\n}\\n\\n.error-btn {\\n  padding: 0.5rem 1rem;\\n  background-color: #ff4444;\\n  color: white;\\n  border: none;\\n  border-radius: 4px;\\n  cursor: pointer;\\n  transition: background-color 0.3s;\\n}\\n\\n.error-btn:hover {\\n  background-color: #cc0000;\\n}\\n</style>\\n"}]},"status_code":0,"status_msg":"请求成功"}',
  headers: {
    "content-type": "application/json; charset=utf-8",
    "content-length": "6154",
    "x-powered-by": "Express",
    "access-control-allow-origin": "*",
    "access-control-allow-credentials": "true",
    etag: 'W/"180a-t/7lDToWKIel8/zzsWfCYLZbRlw"',
    date: "Wed, 14 May 2025 11:23:38 GMT",
    server: "Stargate",
    "x-cache": "MISS from cachemd5212.10jqka.com.cn",
    via: "1.1 cachemd5212.10jqka.com.cn (squid/3.5.20)",
    connection: "keep-alive",
  },
  files: [],
};

// 6. 源码截取
// 输入: yuanma.body
const yuanmaBody = {
  bizTreeName: "kingfisher-analyze-container",
  programBuildVersion: "20250514161642.wangyifan.f1566b04.169.tjc-20250514",
  list: [
    {
      originalLine: 150,
      originalColumn: 10,
      originalPath: "../../src/components/ErrorPage.vue",
      originalName: null,
      originalSource:
        '<template>\n  <div class="error-page">\n    <div class="error-section">\n      <h2>JavaScript 错误示例</h2>\n      <div class="error-buttons">\n        <button @click="triggerSyntaxError" class="error-btn">\n          SyntaxError\n        </button>\n        <button @click="triggerReferenceError" class="error-btn">\n          ReferenceError\n        </button>\n        <button @click="triggerTypeError" class="error-btn">TypeError</button>\n        <button @click="triggerRangeError" class="error-btn">RangeError</button>\n      </div>\n    </div>\n\n    <div class="error-section">\n      <h2>网络错误示例</h2>\n      <div class="error-buttons">\n        <button @click="triggerClientError" class="error-btn">\n          客户端错误 (404)\n        </button>\n        <button @click="triggerServerError" class="error-btn">\n          服务器错误 (500)\n        </button>\n        <button @click="triggerNetworkConnectionError" class="error-btn">\n          网络连接错误\n        </button>\n        <button @click="triggerBlockedRequest" class="error-btn">\n          请求被阻止\n        </button>\n        <button @click="triggerParseError" class="error-btn">\n          数据解析错误\n        </button>\n      </div>\n    </div>\n    <div class="error-section">\n      <h2>主动上报</h2>\n      <div class="error-buttons">\n        <button @click="reportFrameFn" class="error-btn">主动上报异常</button>\n        <button @click="reportTti" class="error-btn">主动上报性能-tti</button>\n        <button @click="reportLcp" class="error-btn">主动上报性能-lcp</button>\n      </div>\n    </div>\n  </div>\n</template>\n\n<script setup lang="ts">\n// 声明全局 ClientMonitor 接口\ndeclare global {\n  interface Window {\n    ClientMonitor: {\n      reportFrameErrors: (context: any, error: Error) => void;\n      setPerformanceData: (context: any, data: any) => void;\n    };\n  }\n}\n\n// SyntaxError: 语法错误示例\nconst triggerSyntaxError = () => {\n  // 语法错误的代码：缺少右括号\n  eval("function test() { console.log(\'test\'");\n};\n\n// ReferenceError: 引用未定义变量示例\nconst triggerReferenceError = () => {\n  // 引用一个未定义的变量\n  // @ts-ignore - 故意触发 ReferenceError\n  console.log(nonExistentVariable);\n};\n\n// TypeError: 类型错误示例\nconst triggerTypeError = () => {\n  // 尝试调用一个数字的方法\n  const num = 123;\n  // @ts-ignore - 故意触发 TypeError\n  num.toUpperCase();\n};\n\n// RangeError: 数值越界示例\nconst triggerRangeError = () => {\n  // 创建一个超出最大长度的数组\n  new Array(-1);\n};\n\n// 客户端错误示例 (404 Not Found)\nconst triggerClientError = async () => {\n  const response = await fetch("https://api.example.com/nonexistent");\n  if (!response.ok) {\n    throw new Error(`客户端错误: ${response.status} ${response.statusText}`);\n  }\n};\n\n// 服务器错误示例 (500 Internal Server Error)\nconst triggerServerError = async () => {\n  const response = await fetch("https://httpstat.us/500");\n  if (!response.ok) {\n    throw new Error(`服务器错误: ${response.status} ${response.statusText}`);\n  }\n};\n\n// 网络连接错误示例\nconst triggerNetworkConnectionError = async () => {\n  try {\n    // 尝试连接到一个不存在的域名\n    await fetch("https://this-domain-does-not-exist.example");\n  } catch (error: unknown) {\n    if (error instanceof Error) {\n      throw new Error(`网络连接错误: ${error.message}`);\n    }\n    throw new Error("未知网络错误");\n  }\n};\n\n// 请求被阻止示例\nconst triggerBlockedRequest = async () => {\n  try {\n    // 尝试访问一个被 CORS 策略阻止的 API\n    await fetch("https://api.example.com/data", {\n      mode: "cors",\n      headers: {\n        Origin: "https://different-origin.com",\n      },\n    });\n  } catch (error: unknown) {\n    if (error instanceof Error) {\n      throw new Error(`请求被阻止: ${error.message}`);\n    }\n    throw new Error("未知请求错误");\n  }\n};\n\n// 数据解析错误示例\nconst triggerParseError = async () => {\n  try {\n    const response = await fetch("https://api.example.com/invalid-json");\n    const text = await response.text();\n    // 尝试解析无效的 JSON 数据\n    JSON.parse(text);\n  } catch (error: unknown) {\n    if (error instanceof Error) {\n      throw new Error(`数据解析错误: ${error.message}`);\n    }\n    throw new Error("未知解析错误");\n  }\n};\n\nconst reportFrameFn = () => {\n  try {\n    throw new Error("我是主动抛出的异常, 设置 1s 后上报");\n  } catch (err) {\n    console.log(err);\n    window.ClientMonitor.reportFrameErrors(\n      {\n        category: "ajax",\n        content: "我是上下文信息",\n        level: 1,\n      },\n      err as Error\n    );\n  }\n};\n\nconst reportTti = () => {\n  window.ClientMonitor.setPerformanceData({}, { ttiTime: 54321 });\n};\n\nconst reportLcp = () => {\n  window.ClientMonitor.setPerformanceData({}, { lcpTime: 1234 });\n};\n</script>\n\n<style scoped>\n.error-page {\n  padding: 2rem;\n  text-align: center;\n}\n\n.error-section {\n  margin-bottom: 3rem;\n  padding: 2rem;\n  border: 1px solid #eee;\n  border-radius: 8px;\n  background-color: #fafafa;\n}\n\n.error-section h2 {\n  margin-bottom: 1.5rem;\n  color: #333;\n}\n\n.error-buttons {\n  display: flex;\n  gap: 1rem;\n  justify-content: center;\n  flex-wrap: wrap;\n}\n\n.error-btn {\n  padding: 0.5rem 1rem;\n  background-color: #ff4444;\n  color: white;\n  border: none;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background-color 0.3s;\n}\n\n.error-btn:hover {\n  background-color: #cc0000;\n}\n</style>\n',
    },
  ],
};
// 输出: 源码片段
const yuanmaBodyJieQu = {
  bizTreeName: "kingfisher-analyze-container",
  programBuildVersion: "20250514161642.wangyifan.f1566b04.169.tjc-20250514",
  list: [
    {
      originalLine: 150,
      originalColumn: 10,
      originalPath: "../../src/components/ErrorPage.vue",
      originalName: null,
      originalSource:
        '  }\n};\n\n// 数据解析错误示例\nconst triggerParseError = async () => {\n  try {\n    const response = await fetch("https://api.example.com/invalid-json");\n    const text = await response.text();\n    // 尝试解析无效的 JSON 数据\n    JSON.parse(text);\n  } catch (error: unknown) {\n    if (error instanceof Error) {\n      throw new Error(`数据解析错误: ${error.message}`);\n    }\n    throw new Error("未知解析错误");\n  }\n};\n\nconst reportFrameFn = () => {\n  try {\n    throw new Error("我是主动抛出的异常, 设置 1s 后上报");\n  } catch (err) {\n    console.log(err);\n    window.ClientMonitor.reportFrameErrors(\n      {\n        category: "ajax",\n        content: "我是上下文信息",\n        level: 1,\n      },\n      err as Error\n    );\n  }\n};\n\nconst reportTti = () => {\n  window.ClientMonitor.setPerformanceData({}, { ttiTime: 54321 });\n};\n\nconst reportLcp = () => {\n  window.ClientMonitor.setPerformanceData({}, { lcpTime: 1234 });\n};',
    },
  ],
};

// 7. 整合源码信息
// 输入: yuanmaBodyJieQu.list

// 输出: 整合后的源码信息
