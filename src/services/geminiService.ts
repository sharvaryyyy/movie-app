import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

export interface MovieRecommendation {
  title: string;
  genre: string;
  releaseYear: string;
  description: string;
  posterUrl?: string;
}

export async function getMovieRecommendations(
  userInput: string,
  userPreferences?: string,
  filters?: { genre?: string; mood?: string; language?: string }
): Promise<MovieRecommendation[]> {
  if (!ai) {
    console.error("Gemini API Key is missing. Please add GEMINI_API_KEY to your Secrets.");
    return [];
  }
  const model = "gemini-3-flash-preview";
  
  let prompt = `Act as a movie recommendation expert. Based on the user's request: '${userInput}', suggest 8 movies.`;
  
  if (userPreferences) {
    prompt += `\nBased on user's past preferences: [${userPreferences}], suggest movies that align with their tastes but offer diverse options.`;
  }
  
  if (filters) {
    if (filters.genre) prompt += `\nPrefer genre: ${filters.genre}.`;
    if (filters.mood) prompt += `\nMood should be: ${filters.mood}.`;
    if (filters.language) prompt += `\nLanguage: ${filters.language}.`;
  }

  prompt += `\nFor each movie, find and include: 
- Title
- Genre
- Release Year
- Short 2-line description
- A direct, high-quality URL to the official movie poster image (posterUrl). Use Google Search to find reliable, direct image links (e.g., from TMDb, IMDb, or official sources).

Make sure suggestions are accurate and diverse.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [
          { googleSearch: {} }
        ],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              genre: { type: Type.STRING },
              releaseYear: { type: Type.STRING },
              description: { type: Type.STRING },
              posterUrl: { type: Type.STRING },
            },
            required: ["title", "genre", "releaseYear", "description", "posterUrl"],
          },
        },
        toolConfig: {
          includeServerSideToolInvocations: true
        }
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}
