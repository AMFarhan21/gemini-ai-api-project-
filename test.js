import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai";

dotenv.config()

const GEMINI_AI_STUDIO_API_KEY = process.env.GEMINI_AI_STUDIO_API_KEY
const ai = new GoogleGenAI({
  apiKey: GEMINI_AI_STUDIO_API_KEY
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Hello world",
  });
  console.log(response.text);
}

main();
