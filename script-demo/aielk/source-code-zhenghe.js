/*
 * @Author: taojinchao
 * @Date: 2025-05-14 21:14:58
 * @LastEditors: taojinchao
 * @LastEditTime: 2025-06-12 14:57:23
 * @Description: 存在源码处理
 */
const list = [
  {
    originalLine: 120,
    originalColumn: 10,
    originalPath: "../../src/components/ErrorPage.vue",
    originalName: null,
    originalSource:
      '  }\n};\n\n// 数据解析错误示例\nconst triggerParseError = async () => {\n  try {\n    const response = await fetch("https://api.example.com/invalid-json");\n    const text = await response.text();\n    // 尝试解析无效的 JSON 数据\n    JSON.parse(text);\n  } catch (error: unknown) {\n    if (error instanceof Error) {\n      throw new Error(`数据解析错误: ${error.message}`);\n    }\n    throw new Error("未知解析错误");\n  }\n};\n\nconst reportFrameFn = () => {\n  try {\n    throw new Error("我是主动抛出的异常, 设置 1s 后上报");\n  } catch (err) {\n    console.log(err);\n    window.ClientMonitor.reportFrameErrors(\n      {\n        category: "ajax",\n        content: "我是上下文信息",\n        level: 1,\n      },\n      err as Error\n    );\n  }\n};\n\nconst reportTti = () => {\n  window.ClientMonitor.setPerformanceData({}, { ttiTime: 54321 });\n};\n\nconst reportLcp = () => {\n  window.ClientMonitor.setPerformanceData({}, { lcpTime: 1234 });\n};',
  },
  {
    originalLine: 150,
    originalColumn: 10,
    originalPath: "../../src/components/ErrorPage.vue",
    originalName: null,
    originalSource:
      '  }\n};\n\n// 数据解析错误示例\nconst triggerParseError = async () => {\n  try {\n    const response = await fetch("https://api.example.com/invalid-json");\n    const text = await response.text();\n    // 尝试解析无效的 JSON 数据\n    JSON.parse(text);\n  } catch (error: unknown) {\n    if (error instanceof Error) {\n      throw new Error(`数据解析错误: ${error.message}`);\n    }\n    throw new Error("未知解析错误");\n  }\n};\n\nconst reportFrameFn = () => {\n  try {\n    throw new Error("我是主动抛出的异常, 设置 1s 后上报");\n  } catch (err) {\n    console.log(err);\n    window.ClientMonitor.reportFrameErrors(\n      {\n        category: "ajax",\n        content: "我是上下文信息",\n        level: 1,\n      },\n      err as Error\n    );\n  }\n};\n\nconst reportTti = () => {\n  window.ClientMonitor.setPerformanceData({}, { ttiTime: 54321 });\n};\n\nconst reportLcp = () => {\n  window.ClientMonitor.setPerformanceData({}, { lcpTime: 1234 });\n};',
  },
];
function getSourceInfoString(list) {
  return list
    .map(
      (item) =>
        `其中 ${item.originalPath}:${item.originalLine}:${item.originalColumn} 的源码为: ${item.originalSource}`
    )
    .join("\n");
}

// 调用
const result = getSourceInfoString(list);
console.log(result);
