<template>
  <div class="request-container">
    <h3>Server-Sent Events (SSE)</h3>
    <div class="input-group">
      <input v-model="question" placeholder="输入你的问题" class="input" />
      <button @click="sendRequest" :disabled="loading">
        {{ loading ? "SSE 连接中..." : "开始 SSE" }}
      </button>
    </div>
    <div class="response">
      <h4>响应内容：</h4>
      <div class="content">{{ content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const question = ref("");
const content = ref("");
const loading = ref(false);

const sendRequest = async () => {
  if (!question.value) return;
  
  loading.value = true;
  content.value = '';

  try {
    /** 
     * model：指定了要调用的模型类型
     * role: 枚举字段 
     *   system: 提示词
     *   user: 用户消息
     *   assistant: AI 应答消息
     * stream：是否以流式（streaming）传输
    */
    const response = await fetch('http://localhost:3000/api/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        question: question.value
      })
    });
    // response.body:  一个可读流（ReadableStream）,类比流水线
    // getReader(): 创建一个可读流的读取器（ReadableStreamDefaultReader）,类比流水线上的工人
    const reader = response.body?.getReader();
    if (!reader) {
      content.value = '错误: 响应体不可读，无法获取流式数据';
      loading.value = false;
      return;
    }
    // 创建一个文本解码器：用于将二进制数据流解码为字符串
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      // 读取流式数据: 会从可读流（ReadableStream）中读取下一块数据（chunk），类比流水线产品
      // 返回一个 Promise: { value: Uint8Array, done: boolean }
      // value: 当前读取到的数据块，类型为 Uint8Array，表示二进制数据
      //      基础格式：data: {"id":"6666666","object":"chat.completion","created":1720000000}
      // done: 布尔值，来自浏览器 API，表示HTTP 连接是否已经关闭，数据流是否已经传输完毕
      //      触发时机：服务器关闭连接、网络异常断开 ，没有更多数据可读
      const { value, done } = await reader.read();
      console.log('value', value);
      if (done) break;
      // chunkValue: 每次读取到的数据块由底层网络缓冲区决定，可能一条，也可能多条，甚至并不完整
      const chunkValue = decoder.decode(value);
      buffer += chunkValue;
      // 标准的SSE格式: 每条数据以两个换行符（\n\n）结束
      const lines = chunkValue.split('\n\n');
      // 保留不完整的行
      buffer = lines.pop() || '';
      console.log('lines', lines);
      for (const line of lines) {
        // 过滤出不以 'data: ' 开头的行有时服务器还可能发送其它类型的行
        //（比如 event: ...、id: ...、注释行等），或者 chunk 里有空行、杂行
        if (!line.startsWith('data: ')) {
          continue;
        }
        // 去掉 'data: ' 前缀
        const incoming = line.slice(6);
        // [DONE]：表示业务逻辑上的任务完成
        // 触发时机：当 AI 模型完成文本生成，服务器主动发送 [DONE] 标记
        if (incoming === '[DONE]') {
          break;
        }
        try {
          // 解析 JSON 数据，提取内容
          const data = JSON.parse(incoming);
          console.log('data', data);
          const delta = data.choices[0].delta.content;
          if (delta) content.value += delta;
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      }
    }
  } catch (error: any) {
    content.value = `错误: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

// let eventSource: EventSource | null = null;

// const startSSE = () => {
//   if (!question.value) return;

//   loading.value = true;
//   content.value = "";

//   // 创建 EventSource 连接，连接到本地服务器
//   eventSource = new EventSource(
//     `http://localhost:3000/api/sse?question=${encodeURIComponent(
//       question.value
//     )}`
//   );

//   // 监听消息事件
//   eventSource.onmessage = (event) => {
//     const data = JSON.parse(event.data);
//     if (data.type === "content") {
//       content.value += data.content;
//     } else if (data.type === "done") {
//       // 客户端主动关闭连接
//       stopSSE();
//     } else if (data.type === "error") {
//       content.value = `错误: ${data.error}`;
//       stopSSE();
//     }
//   };

//   // 监听错误事件
//   eventSource.onerror = (error) => {
//     console.error("SSE Error:", error);
//     content.value = "SSE 连接错误";
//     stopSSE();
//   };
// };

// const stopSSE = () => {
//   if (eventSource) {
//     eventSource.close();
//     eventSource = null;
//   }
//   loading.value = false;
// };

</script>

<style scoped>
.request-container {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.response {
  margin-top: 15px;
}

.content {
  white-space: pre-wrap;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  min-height: 100px;
}
</style>
