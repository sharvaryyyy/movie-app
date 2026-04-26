import express from "express";
import { getTrendingMovies, logRecommendation, saveUserPreference } from "../controllers/movieController";

const router = express.Router();

router.get("/trending", getTrendingMovies);
router.post("/log-recommendation", logRecommendation);
router.post("/save-preference", saveUserPreference);

export default router;
