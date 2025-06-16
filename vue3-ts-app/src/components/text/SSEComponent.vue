<template>
  <div class="request-container">
    <h3>Server-Sent Events (SSE)</h3>
    <div class="input-group">
      <input v-model="question" placeholder="输入你的问题" class="input" />
      <button @click="startSSE" :disabled="loading">
        {{ loading ? "SSE 连接中..." : "开始 SSE" }}
      </button>
      <button @click="stopSSE" :disabled="!loading">停止 SSE</button>
    </div>
    <div class="response">
      <h4>响应内容：</h4>
      <div class="content">{{ content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue";

const question = ref("");
const content = ref("");
const loading = ref(false);
let eventSource: EventSource | null = null;

const startSSE = () => {
  if (!question.value) return;

  loading.value = true;
  content.value = "";

  // 创建 EventSource 连接，连接到本地服务器
  eventSource = new EventSource(
    `http://localhost:3000/api/sse?question=${encodeURIComponent(
      question.value
    )}`
  );

  // 监听消息事件
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "content") {
      content.value += data.content;
    } else if (data.type === "done") {
      // 客户端主动关闭连接
      stopSSE();
    } else if (data.type === "error") {
      content.value = `错误: ${data.error}`;
      stopSSE();
    }
  };

  // 监听错误事件
  eventSource.onerror = (error) => {
    console.error("SSE Error:", error);
    content.value = "SSE 连接错误";
    stopSSE();
  };
};

const stopSSE = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  loading.value = false;
};

// 组件卸载时关闭连接
onUnmounted(() => {
  stopSSE();
});
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
