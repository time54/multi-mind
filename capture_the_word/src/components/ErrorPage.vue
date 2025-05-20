<template>
  <div class="error-page">
    <div class="error-section">
      <h2>JavaScript 错误示例</h2>
      <div class="error-buttons">
        <button @click="triggerSyntaxError" class="error-btn">
          SyntaxError
        </button>
        <button @click="triggerReferenceError" class="error-btn">
          ReferenceError
        </button>
        <button @click="triggerTypeError" class="error-btn">TypeError</button>
        <button @click="triggerRangeError" class="error-btn">RangeError</button>
      </div>
    </div>

    <div class="error-section">
      <h2>网络错误示例</h2>
      <div class="error-buttons">
        <button @click="triggerClientError" class="error-btn">
          客户端错误 (404)
        </button>
        <button @click="triggerServerError" class="error-btn">
          服务器错误 (500)
        </button>
        <button @click="triggerNetworkConnectionError" class="error-btn">
          网络连接错误
        </button>
        <button @click="triggerBlockedRequest" class="error-btn">
          请求被阻止
        </button>
        <button @click="triggerParseError" class="error-btn">
          数据解析错误
        </button>
        <button @click="triggerSSLError" class="error-btn">SSL 错误</button>
      </div>
    </div>
    <div class="error-section">
      <h2>主动上报</h2>
      <div class="error-buttons">
        <button @click="reportFrameFn" class="error-btn">主动上报异常</button>
        <button @click="reportTti" class="error-btn">主动上报性能-tti</button>
        <button @click="reportLcp" class="error-btn">主动上报性能-lcp</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 声明全局 ClientMonitor 接口
declare global {
  interface Window {
    ClientMonitor: {
      reportFrameErrors: (context: any, error: Error) => void;
      setPerformanceData: (context: any, data: any) => void;
    };
  }
}

// SyntaxError: 语法错误示例
const triggerSyntaxError = () => {
  // 语法错误的代码：缺少右括号
  eval("function test() { console.log('test'");
};

// ReferenceError: 引用未定义变量示例
const triggerReferenceError = () => {
  // 引用一个未定义的变量
  // @ts-ignore - 故意触发 ReferenceError
  console.log(nonExistentVariable);
};

// TypeError: 类型错误示例
const triggerTypeError = () => {
  // 尝试调用一个数字的方法
  const num = 123;
  // @ts-ignore - 故意触发 TypeError
  num.toUpperCase();
};

// RangeError: 数值越界示例
const triggerRangeError = () => {
  // 创建一个超出最大长度的数组
  new Array(-1);
};

// 客户端错误示例 (404 Not Found)
const triggerClientError = async () => {
  const response = await fetch("https://api.example.com/nonexistent");
  if (!response.ok) {
    throw new Error(`客户端错误: ${response.status} ${response.statusText}`);
  }
};

// 服务器错误示例 (500 Internal Server Error)
const triggerServerError = async () => {
  const response = await fetch("https://httpstat.us/500");
  if (!response.ok) {
    throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
  }
};

// 网络连接错误示例
const triggerNetworkConnectionError = async () => {
  try {
    // 尝试连接到一个不存在的域名
    await fetch("https://this-domain-does-not-exist.example");
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`网络连接错误: ${error.message}`);
    }
    throw new Error("未知网络错误");
  }
};

// 请求被阻止示例
const triggerBlockedRequest = async () => {
  try {
    // 尝试访问一个被 CORS 策略阻止的 API
    await fetch("https://api.example.com/data", {
      mode: "cors",
      headers: {
        Origin: "https://different-origin.com",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`请求被阻止: ${error.message}`);
    }
    throw new Error("未知请求错误");
  }
};

// 数据解析错误示例
const triggerParseError = async () => {
  try {
    const response = await fetch("https://api.example.com/invalid-json");
    const text = await response.text();
    // 尝试解析无效的 JSON 数据
    JSON.parse(text);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`数据解析错误: ${error.message}`);
    }
    throw new Error("未知解析错误");
  }
};

// SSL 错误示例
const triggerSSLError = async () => {
  try {
    // 访问一个已知的自签名或无效证书的 HTTPS 地址
    await fetch("https://self-signed.badssl.com/");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`SSL 错误: ${error.message}`);
    }
    throw new Error("未知 SSL 错误");
  }
};

const reportFrameFn = () => {
  try {
    throw new Error("我是主动抛出的异常, 设置 1s 后上报");
  } catch (err) {
    console.log(err);
    window.ClientMonitor.reportFrameErrors(
      {
        category: "ajax",
        content: "我是上下文信息",
        level: 1,
      },
      err as Error
    );
  }
};

const reportTti = () => {
  window.ClientMonitor.setPerformanceData({}, { ttiTime: 54321 });
};

const reportLcp = () => {
  window.ClientMonitor.setPerformanceData({}, { lcpTime: 1234 });
};
</script>

<style scoped>
.error-page {
  padding: 2rem;
  text-align: center;
}

.error-section {
  margin-bottom: 3rem;
  padding: 2rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fafafa;
}

.error-section h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.error-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-btn {
  padding: 0.5rem 1rem;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.error-btn:hover {
  background-color: #cc0000;
}
</style>
