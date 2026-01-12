// src/services/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateReply = async (
  apiKey: string,
  userPrompt: string,
  tone: string
) => {
  // CRITICAL: Stop the call if the key is missing before it reaches Google
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "API Key is missing. Please save it in the extension popup settings."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel(
    { model: "gemini-2.5-flash" },
    { apiVersion: "v1" }
  );

  const systemPrompt = `You are a professional email assistant. 
    Draft a response that is ${tone.toLowerCase()}. 
    Keep it concise and professional. 
    Context of email to reply to: ${userPrompt}`;

  try {
    const result = await model.generateContent(systemPrompt);
    return result.response.text();
  } catch (error: any) {
    // If the key is invalid, Google returns 403 here
    console.error("DETAILED GEMINI ERROR:", error);
    throw new Error(error.message || "Failed to generate response.");
  }
};
