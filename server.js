
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoMode = process.env.PQAI_DEMO !== "false";
const provider = (process.env.PQAI_PROVIDER || "ollama").toLowerCase();

const ollamaUrl = (
  process.env.OLLAMA_URL || "http://127.0.0.1:11434"
).replace(/\/+$/, "");

const ollamaModel = process.env.OLLAMA_MODEL || "qwen3:14b";
const xaiModel = process.env.XAI_MODEL || "grok-4.7";
const xaiUrl = "https://api.x.ai/v1/responses";

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const activeModel = provider === "xai" ? xaiModel : ollamaModel;

console.log(
  demoMode
    ? "PQAI 모드: 무료 데모"
    : `PQAI 모드: ${provider}, 모델: ${activeModel}`
);

// 서버 상태 확인
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mode: demoMode ? "demo" : provider,
    model: demoMode ? null : activeModel,
    message: "PQAI 서버가 정상 작동 중입니다."
  });
});

// 채팅 API
app.post("/api/chat", async (req, res) => {
  try {
    const body = req.body || {};

    const incoming = Array.isArray(body.messages)
      ? body.messages
      : typeof body.message === "string"
        ? [{ role: "user", content: body.message }]
        : [];

    const messages = incoming
      .filter(
        (m) =>
          m &&
          typeof m.content === "string" &&
          m.content.trim()
      )
      .slice(-30)
      .map((m) => ({
        role:
          m.role === "assistant" || m.role === "system"
            ? m.role
            : "user",
        content: m.content.trim().slice(0, 12000)
      }));

    const lastUser = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUser) {
      return res.status(400).json({
        error: "메시지를 입력해 주세요."
      });
    }

    // 무료 데모 모드
    if (demoMode) {
      const message = lastUser.content;
      const lower = message.toLowerCase();
      let reply;

      if (
        lower.includes("안녕") ||
        lower.includes("hello") ||
        lower.includes("hi")
      ) {
        reply =
          "안녕하세요! 저는 PQAI 무료 데모예요. 무엇을 도와드릴까요?";
      } else if (
        lower.includes("너는 누구") ||
        lower.includes("누구야") ||
        lower.includes("who are you")
      ) {
        reply =
          "저는 PQAI입니다. 지금은 무료 데모 모드로 작동하고 있어요.";
      } else if (
        lower.includes("코드") ||
        lower.includes("프로그래밍") ||
        lower.includes("코딩")
      ) {
        reply =
          "코딩을 도와드릴게요! 어떤 프로그램을 만들고 싶은지 알려주세요.";
      } else {
        reply =
          `PQAI 무료 데모가 메시지를 받았어요: "${message}"\n\n` +
          "현재는 테스트용 답변을 제공하고 있습니다.";
      }

      return res.json({
        reply,
        text: reply,
        mode: "demo"
      });
    }

    let reply;

    // Grok API
    if (provider === "xai") {
      const apiKey = process.env.XAI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          error:
            "XAI_API_KEY가 없습니다. 프로젝트의 .env 파일을 확인해 주세요."
        });
      }

      const input = [
        {
          role: "system",
          content:
            "너는 PQAI라는 유능하고 친절한 AI 비서야. " +
            "한국어로 정확하고 이해하기 쉽게 답변해. " +
            "복잡한 문제는 단계별로 설명하고, " +
            "코드 요청에는 실행 가능한 코드와 설명을 제공해. " +
            "모르는 사실을 아는 것처럼 지어내지 마."
        },
        ...messages
      ];

      const response = await fetch(xaiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: xaiModel,
          input: input.map((m) => ({
            role: m.role,
            content: m.content
          })),
          store: false
        }),
        signal: AbortSignal.timeout(300000)
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        data = {};
      }

      if (!response.ok) {
        console.error("Grok API 상세 오류:", responseText);
        throw new Error(
          `Grok API 오류: HTTP ${response.status} - ${
            data.error?.message || responseText || "상세 오류 없음"
          }`
        );
      }

      reply =
        data.output_text ||
        (Array.isArray(data.output)
          ? data.output
              .filter((item) => item.type === "message")
              .flatMap((item) => item.content || [])
              .filter((item) => item.type === "output_text")
              .map((item) => item.text)
              .join("\n")
          : "");

    // Ollama 로컬 AI
    } else if (provider === "ollama") {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          messages: [
            {
              role: "system",
              content:
                "너는 PQAI라는 친절한 AI 비서야. " +
                "한국어로 정확하고 이해하기 쉽게 답변해."
            },
            ...messages
          ]
        }),
        signal: AbortSignal.timeout(300000)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || `Ollama 오류: HTTP ${response.status}`
        );
      }

      reply = data.message?.content;

    } else {
      return res.status(500).json({
        error:
          "지원하지 않는 AI 설정입니다. .env에서 PQAI_PROVIDER를 확인해 주세요."
      });
    }

    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("AI에서 답변을 받지 못했습니다.");
    }

    return res.json({
      reply: reply.trim(),
      text: reply.trim(),
      mode: provider,
      model: activeModel
    });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: `AI 연결 오류: ${error.message}`
    });
  }
});

// 이미지 API: 아직 미리보기만 제공
app.post("/api/image", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();

    if (!prompt) {
      return res.status(400).json({
        error: "이미지 설명을 입력해 주세요."
      });
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="768" height="512" viewBox="0 0 768 512">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#172554"/>
            <stop offset="100%" stop-color="#7c3aed"/>
          </linearGradient>
        </defs>
        <rect width="768" height="512" rx="24" fill="url(#bg)"/>
        <circle cx="384" cy="190" r="70"
                fill="#fef3c7" opacity=".9"/>
        <path d="M0 390 Q180 260 360 400 T768 360 V512 H0Z"
              fill="#0f172a" opacity=".65"/>
        <text x="384" y="430" text-anchor="middle"
              font-size="22" fill="white"
              font-family="Arial, sans-serif">PQAI Preview</text>
        <text x="384" y="465" text-anchor="middle"
              font-size="14" fill="white"
              font-family="Arial, sans-serif">Demo - No AI image generated</text>
      </svg>
    `;

    return res.json({
      image:
        "data:image/svg+xml;base64," +
        Buffer.from(svg).toString("base64"),
      mode: "demo",
      message:
        "미리보기 이미지입니다. 실제 AI 이미지 생성은 아직 연결되지 않았습니다."
    });
  } catch (error) {
    console.error("Image API error:", error);

    return res.status(500).json({
      error: "이미지 미리보기를 만들지 못했습니다."
    });
  }
});

// 웹페이지
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PQAI 실행 중: http://localhost:${PORT}`);
  console.log(
    demoMode
      ? "무료 데모 답변을 사용합니다."
      : `AI 제공자: ${provider}, 모델: ${activeModel}`
  );
});
