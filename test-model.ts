import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || "YOUR_KEY_HERE" });
async function test() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello"
    });
    console.log(res.text);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
