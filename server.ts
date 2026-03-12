import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for OpenRouter Proxy
  app.post("/api/chat", async (req, res) => {
    const { messages, model } = req.body;
    // Check for key in headers first, then fallback to env
    const apiKey = req.headers["x-api-key"] || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: "Chave API não configurada. Por favor, insira sua chave nas configurações." });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "NEURAL-X Mobile",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || "nvidia/nemotron-3-super-120b-a12b:free",
          messages: messages
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        console.error("OpenRouter Error Details:", JSON.stringify(data, null, 2));
        let errorMessage = data.error?.message || data.error || "Erro na API OpenRouter";
        
        // Handle specific common OpenRouter errors for better UX
        if (errorMessage.includes("No endpoints found")) {
          errorMessage = "Modelo temporariamente indisponível neste nó. Tente outro modelo gratuito.";
        } else if (errorMessage.includes("Provider returned error")) {
          errorMessage = "O provedor da IA retornou um erro. Tente novamente em instantes.";
        }

        return res.status(response.status).json({ error: errorMessage });
      }

      res.json(data);
    } catch (error) {
      console.error("OpenRouter API Error:", error);
      res.status(500).json({ error: "Failed to communicate with OpenRouter." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
