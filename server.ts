import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/parse-meal", async (req, res) => {
    try {
      const { text } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Parse this meal text and estimate the macros. Return only JSON with name, calories, protein, carbs, fat, and mealType (Breakfast, Lunch, Dinner, Snack). Text: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              mealType: { type: Type.STRING }
            },
            required: ["name", "calories", "protein", "carbs", "fat", "mealType"]
          }
        }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to parse meal" });
    }
  });

  app.post("/api/recommendations", async (req, res) => {
    try {
      const { data } = req.body;
      const { bmi, bmiCategory, currentWeight, startWeight, avgCalories, avgProtein, recentWorkouts, age, gender } = data;
      
      const prompt = `You are an expert fitness and nutrition AI coach. Based on the following user data, provide highly personalized recommendations. 
Format your response exactly as JSON with 3 specific sections (strings): dietRecommendations, workoutAdjustments, progressAnalysis.
Be specific, motivating, and actionable. Avoid using asterisks. Keep it relatively concise but impactful.

User Profile:
- BMI: ${bmi} (${bmiCategory})
- Current Weight: ${currentWeight}kg, Starting Weight: ${startWeight}kg
- Recent meals (last 3 days avg): ${avgCalories} kcal/day, ${avgProtein}g protein
- Recent workouts count: ${recentWorkouts}
- Age: ${age}, Gender: ${gender}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dietRecommendations: { type: Type.STRING },
              workoutAdjustments: { type: Type.STRING },
              progressAnalysis: { type: Type.STRING }
            },
            required: ["dietRecommendations", "workoutAdjustments", "progressAnalysis"]
          }
        }
      });
      
      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
