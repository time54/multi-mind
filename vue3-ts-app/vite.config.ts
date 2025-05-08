import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: true,
    port: 4399,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/klingai": {
        target: "https://api.klingai.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/klingai/, ""),
      },
      "/tts": {
        target: "https://openspeech.bytedance.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tts/, ""),
      },
    },
  },
});
