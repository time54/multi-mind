<template>
  <div class="request-container">
    <h3>Streams API 流式传输</h3>
    <div class="input-group">
      <input v-model="question" placeholder="输入你的问题" class="input" />
      <button @click="sendRequest" :disabled="loading">
        {{ loading ? '流式传输中...' : '发送' }}
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
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: question.value }],
        stream: true
      })
    });
    // 创建一个可读流（ReadableStream）的读取器
    const reader = response.body?.getReader();
    // 创建一个文本解码器：用于将二进制数据解码为文本
    const decoder = new TextDecoder();
    let done = false;
    let buffer = '';

    while (!done) {
      const { value, done: doneReading } = await reader?.read() as Promise<{ value: any; done: boolean }>;
      done = doneReading;
      const chunkValue = buffer + decoder.decode(value);
      buffer = '';
      // 处理数据行：将数据按换行符分割，过滤出以 'data: ' 开头的行（这是 SSE 的标准格式）
      const lines = chunkValue.split('\n').filter((line) => line.startsWith('data: '));

      for (const line of lines) {
        // 去掉 'data: ' 前缀
        const incoming = line.slice(6);
        // 如果收到 '[DONE]' 标记，结束读取
        if (incoming === '[DONE]') {
          done = true;
          break;
        }
        try {
          // 解析 JSON 数据，提取内容
          const data = JSON.parse(incoming);
          const delta = data.choices[0].delta.content;
          if (delta) content.value += delta;
        } catch (ex) {
          // 如果解析失败，将数据缓存到 buffer 中，等待下一次解析
          buffer += `data: ${incoming}`;
        }
      }
    }
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
  background-color: #2196F3;
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