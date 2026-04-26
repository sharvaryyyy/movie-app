import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface MovieRecommendation {
  title: string;
  genre: string;
  releaseYear: string;
  description: string;
}

export async function getMovieRecommendations(
  userInput: string,
  userPreferences?: string,
  filters?: { genre?: string; mood?: string; language?: string }
): Promise<MovieRecommendation[]> {
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

  prompt += `\nFor each movie include: Title, Genre, Release Year, and a Short 2-line description. Make sure suggestions are accurate and diverse.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
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
            },
            required: ["title", "genre", "releaseYear", "description"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}
