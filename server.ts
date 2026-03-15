import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Setup
const dbPath = path.join(process.cwd(), "neural_x.db");
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS assistants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    docs TEXT, -- JSON string of docs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    assistant_id TEXT,
    title TEXT,
    messages TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for OpenRouter Proxy
  app.post("/api/chat", async (req, res) => {
    const { messages, model } = req.body;
    const apiKey = req.headers["x-api-key"] || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ error: "Chave API não configurada. Por favor, insira sua chave nas configurações." });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        let errorMessage = data.error?.message || data.error || "Erro na API OpenRouter";
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

  // Assistant Management Routes
  app.get("/api/assistants", (req, res) => {
    try {
      const assistants = db.prepare("SELECT * FROM assistants ORDER BY created_at DESC").all();
      const formatted = assistants.map((a: any) => ({
        ...a,
        docs: JSON.parse(a.docs || "[]")
      }));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar assistentes." });
    }
  });

  app.post("/api/assistants", (req, res) => {
    const { id, name, description, docs } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO assistants (id, name, description, docs) VALUES (?, ?, ?, ?)");
      stmt.run(id, name, description, JSON.stringify(docs || []));
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao salvar assistente." });
    }
  });

  app.delete("/api/assistants/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM assistants WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir assistente." });
    }
  });

  // Chat Management Routes
  app.get("/api/chats", (req, res) => {
    try {
      const chats = db.prepare("SELECT * FROM chats ORDER BY updated_at DESC").all();
      const formatted = chats.map((c: any) => ({
        ...c,
        messages: JSON.parse(c.messages || "[]")
      }));
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar conversas." });
    }
  });

  app.post("/api/chats", (req, res) => {
    const { id, assistant_id, title, messages } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO chats (id, assistant_id, title, messages, updated_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET 
          messages = excluded.messages,
          title = excluded.title,
          updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(id, assistant_id, title, JSON.stringify(messages || []));
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error saving chat:", error);
      res.status(500).json({ error: "Erro ao salvar conversa." });
    }
  });

  app.delete("/api/chats/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM chats WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir conversa." });
    }
  });

  // File Processing Route
  app.post("/api/process-file", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    try {
      let content = "";
      if (req.file.mimetype === "application/pdf") {
        const data = await pdf(req.file.buffer);
        content = data.text;
      } else {
        content = req.file.buffer.toString("utf-8");
      }

      res.json({ 
        name: req.file.originalname, 
        content: Buffer.from(content).toString("base64"),
        type: req.file.mimetype === "application/pdf" ? "text/plain" : req.file.mimetype,
        text: content.substring(0, 5000) // Preview text
      });
    } catch (error) {
      console.error("File processing error:", error);
      res.status(500).json({ error: "Erro ao processar arquivo." });
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
