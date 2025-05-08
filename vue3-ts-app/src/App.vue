<!--
 * @Author: taojinchao
 * @Date: 2025-05-06 13:50:43
 * @LastEditors: taojinchao
 * @LastEditTime: 2025-05-08 14:56:55
 * @Description: 
-->
<template>
  <div class="app-container">
    <h1>大模型调用</h1>
    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </div>
    </div>

    <div class="tab-content">
      <!-- 文本大模型 -->
      <div v-if="activeTab === 'text'" class="model-section">
        <table class="model-table">
          <thead>
            <tr>
              <th>生成方式</th>
              <th>组件</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>普通 HTTP</td>
              <td><HttpRequest /></td>
            </tr>
            <tr>
              <td>Streams API</td>
              <td><StreamsApi /></td>
            </tr>
            <tr>
              <td>Server-Sent Events</td>
              <td><SSEComponent /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 图像大模型 -->
      <div v-if="activeTab === 'image'" class="model-section">
        <table class="model-table">
          <thead>
            <tr>
              <th>生成方式</th>
              <th>组件</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>文生图</td>
              <td><TextToImage /></td>
            </tr>
            <tr>
              <td>图生图</td>
              <td><ImageToImage /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 语音合成大模型 -->
      <div v-if="activeTab === 'audio'" class="model-section">
        <table class="model-table">
          <thead>
            <tr>
              <th>生成方式</th>
              <th>组件</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>文字转语音</td>
              <td><TextToAudio /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 视觉大模型 -->
      <div v-if="activeTab === 'vision'" class="model-section">
        <table class="model-table">
          <thead>
            <tr>
              <th>生成方式</th>
              <th>组件</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>图片识别</td>
              <td><ImageToText /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
// 文本大模型组件
import HttpRequest from "./components/text/HttpRequest.vue";
import StreamsApi from "./components/text/StreamsApi.vue";
import SSEComponent from "./components/text/SSEComponent.vue";

// 图像大模型组件
import TextToImage from "./components/image/TextToImage.vue";
import ImageToImage from "./components/image/ImageToImage.vue";

// 语音合成大模型组件
import TextToAudio from "./components/audio/TextToAudio.vue";

// 视觉大模型组件
import ImageToText from "./components/vision/ImageToText.vue";

const tabs = [
  { id: "text", name: "文本大模型" },
  { id: "image", name: "图像大模型" },
  { id: "audio", name: "语音合成大模型" },
  { id: "vision", name: "视觉大模型" },
];

const activeTab = ref("vision");
</script>

<style>
.app-container {
  width: 1280px;
  margin: 0 auto;
  padding: 0;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  width: 100%;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  background-color: #f5f5f5;
}

.tab:hover {
  background-color: #e0e0e0;
}

.tab.active {
  background-color: #2196f3;
  color: white;
}

.tab-content {
  width: 100%;
  padding: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.model-section {
  width: 100%;
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.model-table {
  width: 100%;
  border-collapse: collapse;
}

.model-table th,
.model-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.model-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.model-table tr:last-child td {
  border-bottom: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .model-table {
    display: block;
    overflow-x: auto;
  }

  .app-container {
    padding: 10px;
  }
}
</style>
