import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getGeminiModel = (modelName = "gemini-1.5-flash") => {
  if (!genAI) {
    console.error("Gemini API Key is missing. Check .env.local");
    return null;
  }
  return genAI.getGenerativeModel({ model: modelName });
};
