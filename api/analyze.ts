import { GoogleGenAI, Type } from "@google/genai";

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { text } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server Configuration Error: Missing API Key' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze this prompt for an AI image generator: "${text}".
      1. If the input is Chinese, translate it to English. If English, translate to Chinese.
      2. Provide a very concise, one-sentence summary (under 20 words) describing the visual subject,use Chinese.
      
      Return a JSON object.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        cn: { type: Type.STRING, description: "The prompt in Chinese" },
                        en: { type: Type.STRING, description: "The prompt in English" },
                        summary: { type: Type.STRING, description: "A short one-sentence visual summary" },
                    },
                    required: ["cn", "en", "summary"],
                },
            },
        });

        if (response.text) {
            return new Response(response.text, {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        throw new Error("No response from Gemini");

    } catch (error) {
        console.error("Gemini API Error:", error);
        return new Response(JSON.stringify({ error: 'Analysis Failed', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
