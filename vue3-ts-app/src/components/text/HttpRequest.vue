<template>
  <div class="request-container">
    <h3>普通 HTTP 请求</h3>
    <div class="input-group">
      <input v-model="question" placeholder="输入你的问题" class="input" />
      <button @click="sendRequest" :disabled="loading">
        {{ loading ? '请求中...' : '发送' }}
      </button>
    </div>
    <div class="response">
      <h4>响应内容：</h4>
      <div class="content">{{ content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const question = ref('');
const content = ref('');
const loading = ref(false);

const sendRequest = async () => {
  if (!question.value) return;
  
  loading.value = true;
  content.value = '思考中...';

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: question.value }],
        stream: false
      })
    });

    const data = await response.json();
    content.value = data.choices[0].message.content;
  } catch (error) {
    content.value = `错误: ${error.message}`;
  } finally {
    loading.value = false;
  }
};
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
  background-color: #4CAF50;
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