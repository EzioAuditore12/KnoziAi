import { ChatGoogleGenerativeAI } from "@dakshp1234/langchain-google-genai";

const base = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash", apiKey: "foo" });
const fallback = base.withFallbacks({ fallbacks: [] });

console.log("Does fallback have withStructuredOutput?", typeof (fallback as any).withStructuredOutput);
