<template>
  <div class="request-container">
    <div class="input-group">
      <textarea class="input" v-model="prompt" />
      <button @click="generateImage">生成</button>
    </div>
    <div class="output">
      <img :src="imgUrl" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

const prompt = ref('Prompt：A lovely rabbit');
const imgUrl = ref('');

const generateImage = async () => {
  // 定义负面提示词：不希望出现在生成图片中的内容（负面提示词）
  const negativeWords = 'Blurry, Bad, Bad anatomy, Bad proportions, Deformed, Disconnected limbs, Disfigured, Extra arms, Extra limbs, Extra hands, Fused fingers, Gross proportions, Long neck, Malformed limbs, Mutated, Mutated hands, Mutated limbs, Missing arms, Missing fingers, Poorly drawn hands, Poorly drawn face.';

  const endpoint = `/klingai/v1/images/generations`;

  // 获取 JWT Token
  const token = await (await fetch('/api/jwt-auth')).text();

  /** 请求体
   * negative_prompt：负面提示词
   * aspect_ratio：图片宽高比
   */
  const payload = {
    prompt: prompt.value,
    negative_prompt: negativeWords,
    aspect_ratio: '1:1',
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const res = await fetch(endpoint, {
    headers,
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // 错误处理：如果返回状态码不是 2xx，则抛出异常
  if (res.status >= 400) {
    throw new Error(`Non-200 response: ${await res.text()}`);
  }

  // 获取任务ID，轮询任务结果
  const ret: any = await res.json();
  const id = ret.data.task_id;
  const resultUrl = `${endpoint}/${id}`;
  imgUrl.value = 'https://res.bearbobo.com/resource/upload/a3IZyOsZ/loading-giaz5ycpd7j.gif';
  do {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const result = await fetch(resultUrl, {
      headers,
    });
    const resultJson = await result.json();
    const taskStatus = resultJson.data.task_status;
    // 如果状态是 processing 或 submitted，继续等待。
    if (taskStatus === 'processing' || taskStatus === 'submitted') {
      continue;
    }
    // 如果状态是 failed，抛出异常
    if (taskStatus === 'failed') {
      throw new Error(`Task failed: ${JSON.stringify(resultJson)}`);
    }
    // 如果状态是 completed，获取图片 URL
    const sample = resultJson.data?.task_result;
    if (sample) {
      imgUrl.value = sample.images[0].url;
    } else {
      // “无结果”图片
      imgUrl.value = 'https://res.bearbobo.com/resource/upload/vNg4ALJv/6659895-ox36cbkajrr.png';
    }
    break;
  } while (1);
};
</script>
<style scoped>
.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.input {
  flex: 1;
  min-height: 36px;
  resize: vertical;
}
.progress {
  width: 100%;
  height: 0.1rem;
  margin: .4rem 0;
  background: #ccc;
}
.progress > div {
  background: #c00;
  height: 100%;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  height: 100vh;
}
.output {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 1px solid #ccc;
}
.output > img {
  width: 100%;
  max-width: 600px;
}
</style>