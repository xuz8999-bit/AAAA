import express from "express";
import { fileURLToPath } from "node:url";
import { request, result, instructions } from "./schema.mjs";
const app = express();
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (_, res) =>
  res.json({
    ok: true,
    aiConfigured: !!(process.env.AI_API_KEY || process.env.OPENAI_API_KEY),
  }),
);
app.post("/api/ai", async (req, res) => {
  const parsed = request.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "请求格式无效或材料过长" });
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key)
    return res
      .status(503)
      .json({
        error:
          "AI 尚未配置：请在服务端 .env 设置 AI_API_KEY，随后重启服务。本地练习仍可使用。",
      });
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: JSON.stringify(parsed.data) },
        ],
      }),
    });
    if (!response.ok)
      return res
        .status(502)
        .json({
          error: `AI 服务返回 ${response.status}，请检查密钥、额度和模型配置。`,
        });
    const data = await response.json();
    const output = result.parse(JSON.parse(data.choices[0].message.content));
    if (parsed.data.task === "grade" && typeof output.correct !== "boolean")
      throw Error("Missing grade");
    res.json(output);
  } catch {
    res.status(502).json({ error: "AI 请求超时或返回格式无效，请稍后重试。" });
  }
});
app.use(express.static(fileURLToPath(new URL("../dist", import.meta.url))));
app.get("/{*path}", (_, res) =>
  res.sendFile(fileURLToPath(new URL("../dist/index.html", import.meta.url))),
);
app.use((err, req, res, next) =>
  res.status(400).json({ error: "请求无法读取，请检查数据格式和大小" }),
);
app.listen(process.env.PORT || 3001, "0.0.0.0", () =>
  console.log("Study Garden server ready"),
);
