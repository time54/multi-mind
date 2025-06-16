require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// deepseek：SSE 流式响应
app.get("/api/sse", async (req, res) => {
  const question = req.query.question;

  // 设置 SSE 相关的响应头
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

    // 获取响应体
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: isDone } = await reader.read();
      if (isDone) break;

      const chunk = buffer + decoder.decode(value);
      buffer = "";

      // 按行分割数据，每行以 "data: " 开头，并传递给客户端
      const lines = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6); // 去掉 'data: ' 前缀
        if (data === "[DONE]") {
          done = true;
          break;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || "";
          if (content) {
            // 发送数据到客户端
            res.write(
              `data: ${JSON.stringify({ type: "content", content })}\n\n`
            );
          }
        } catch (e) {
          buffer += `data: ${data}`;
        }
      }
    }
    res.write("event: end\n"); // 发送结束事件
    res.write("data: [DONE]\n\n"); // 通知客户端数据流结束
    // res.end(); // 关闭连接
  } catch (error) {
    console.error("Error:", error);
    res.write(
      `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
    );
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
