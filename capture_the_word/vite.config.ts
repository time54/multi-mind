import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  base: "https://khtest.10jqka.com.cn/dev/taojinchao/TEST/sslError/",
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://api.moonshot.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/tts": {
        target: "https://openspeech.bytedance.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tts/, ""),
      },
    },
  },
  plugins: [vue()],
  build: {
    sourcemap: true, // 开启 SourceMap
    rollupOptions: {
      output: {
        // 用于从入口点创建的块的打包输出格式[name]表示文件名,[hash]表示该文件内容hash值
        chunkFileNames: "js/[name]-[hash].js",
        // 用于命名代码拆分时创建的共享块的输出命名
        entryFileNames: "js/[name]-[hash].js",
        // 用于输出静态资源的命名，[ext]表示文件扩展名
        assetFileNames: "[ext]/[name]-[hash].[ext]",
        // 拆分js到模块文件夹
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor"; // 第三方库打包到vendor
          }
        },
      },
    },
  },
});
