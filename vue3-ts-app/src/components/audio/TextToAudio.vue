<template>
  <div class="container">
    <div class="input-group">
      <textarea class="input" type="text" v-model="prompt" />
      <button @click="generateAudio">生成</button>
    </div>
    <div class="output">
      <div>>> {{ status }}</div>
      <audio ref="audioEl"></audio>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

const prompt = ref("Prompt：您好，请问有什么可以帮您？");
const status = ref("ready");
const audioEl = ref<HTMLAudioElement>();

// 创建一个临时 URL 供音频播放
const createBlobURL = (base64AudioData: string): string => {
  var byteArrays = [];
  var byteCharacters = atob(base64AudioData);
  for (var offset = 0; offset < byteCharacters.length; offset++) {
    var byteArray = byteCharacters.charCodeAt(offset);
    byteArrays.push(byteArray);
  }

  var blob = new Blob([new Uint8Array(byteArrays)], { type: "audio/mp3" });

  // 创建一个临时 URL 供音频播放
  return URL.createObjectURL(blob);
};

const generateAudio = async () => {
  const token = import.meta.env.VITE_ACCESS_TOKEN;
  const appId = import.meta.env.VITE_APP_ID;
  const clusterId = import.meta.env.VITE_CLUSTER_ID;
  const voiceName = "zh_female_shuangkuaisisi_moon_bigtts";

  const endpoint = "/tts/api/v1/tts";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer;${token}`,
  };

  const payload = {
    app: {
      appid: appId,
      token,
      cluster: clusterId,
    },
    user: {
      uid: "bearbobo",
    },
    /**
     * 语音合成参数
     * voice_type: 语音类型
     * encoding: 音频编码格式
     * compression_rate: 压缩率，影响音频文件的大小和质量
     * rate: 采样率，影响音频的质量和清晰度
     * speed_ratio: 语速，影响音频的语速
     * volume_ratio: 音量，影响音频的音量
     * pitch_ratio: 音调，影响音频的音调
     * emotion: 情感，影响音频的情感
     */
    audio: {
      voice_type: voiceName,
      encoding: "ogg_opus",
      compression_rate: 1,
      speed_ratio: 1.0,
      volume_ratio: 1.0,
      pitch_ratio: 1.0,
      emotion: "happy",
    },
    request: {
      reqid: Math.random().toString(36).substring(7),
      text: prompt.value,
      text_type: "plain",
      operation: "query",
      silence_duration: "125",
      with_frontend: "1",
      frontend_type: "unitTson",
      pure_english_opt: "1",
    },
  };

  status.value = "generating";
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!data.data) {
    throw new Error(JSON.stringify(data));
  }
  const url = createBlobURL(data.data);

  audioEl.value && (audioEl.value.src = url);
  audioEl.value?.play();
  status.value = "done";
};
</script>
<style scoped>
.input-group {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.input {
  width: 100%;
  height: 2rem;
  font-size: 1rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
}
.progress {
  width: 100%;
  height: 0.1rem;
  margin: 0.4rem 0;
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
}
.output > div {
  width: 100%;
  max-width: 600px;
}
</style>
