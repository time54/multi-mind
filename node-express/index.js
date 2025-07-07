require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createParser } = require("eventsource-parser");
const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(express.json());


// deepseek：SSE 流式响应
app.post("/api/sse", async (req, res) => {
  const question = req.body.question; // 从 body 获取问题

  // 关键设置：设置 SSE 相关的响应头【SSE（流式推送）接口的标准写法】
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // 创建 Deepseek API 请求
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: question }],
        stream: true,
      }),
    });

    const parser = createParser({
      onEvent(event) {
        if (event.data) {
          // 标准的 SSE 格式
          res.write(`data: ${event.data}\n\n`);
        }
      }
    });

    const decoder = new TextDecoder();
    for await (const chunk of response.body) {
      const text = decoder.decode(chunk);
      parser.feed(text);
    }

    // 发送结束标记
    res.write("data: [DONE]\n\n");
    // 结束 SSE 流
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
    res.end();
  }
});

const accessKeyId = process.env.ACCESS_KEY_ID;
const accessKeySecret = process.env.ACCESS_KEY_SECRET;

// 生成 token
async function authKlingai() {
  const headers = {
    algorithm: "HS256",
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKeyId,
    exp: now + 1800, // 有效时间，此处示例代表当前时间+1800s(30min)
    nbf: now - 5, // 开始生效的时间，此处示例代表当前时间-5秒
  };

  const token = jwt.sign(payload, accessKeySecret, headers);
  return token;
}

app.get("/jwt-auth", async (req, res) => {
  const token = await authKlingai();
  res.send(token);
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
