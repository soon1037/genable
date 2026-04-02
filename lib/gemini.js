import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getGeminiModel = (modelName = "gemini-1.5-flash") => {
  console.log("[GEMINI] Initializing model:", modelName);
  if (!genAI) {
    console.error("[GEMINI] API Key is missing. Check .env.local or Vercel Environment Variables");
    return null;
  }
  return genAI.getGenerativeModel({ model: modelName });
};
