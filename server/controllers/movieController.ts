import { Request, Response } from "express";

// Mock trending movies
const TRENDING_MOVIES = [
  { title: "The Godfather", year: "1972", genre: "Crime, Drama" },
  { title: "The Dark Knight", year: "2008", genre: "Action, Crime, Drama" },
  { title: "Pulp Fiction", year: "1994", genre: "Crime, Drama" },
  { title: "Schindler's List", year: "1993", genre: "Biography, Drama, History" },
  { title: "The Shawshank Redemption", year: "1994", genre: "Drama" }
];

export const getTrendingMovies = (req: Request, res: Response) => {
  res.json(TRENDING_MOVIES);
};

export const logRecommendation = (req: Request, res: Response) => {
  const { userId, query, resultsCount } = req.body;
  console.log(`[API] AI Recommendation requested by user ${userId || 'Anonymous'}: "${query}" - Returned ${resultsCount} results.`);
  res.status(200).json({ status: "logged" });
};

export const saveUserPreference = (req: Request, res: Response) => {
  const { userId, genre, count } = req.body;
  console.log(`[API] Saving preference for user ${userId}: Genre: ${genre}, Frequency: ${count}`);
  // In a real MongoDB setup, you'd perform a DB update here.
  // We're using Firestore on the frontend for persistence.
  res.status(202).json({ status: "preference_received" });
};
