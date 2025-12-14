import { AnalysisResult } from "../types";

export const analyzePromptText = async (text: string): Promise<AnalysisResult> => {
  if (!text.trim()) {
    throw new Error("Text is empty");
  }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return data as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback if API fails or key is missing
    return {
      cn: text,
      en: text,
      summary: text.slice(0, 50) + "...",
    };
  }
};
