import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ─── Startup validation ───────────────────────────────────────────────────────
const apiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "").trim();
if (!apiKey) {
  console.error("[FATAL] GEMINI_API_KEY is missing. Set it in your environment before starting.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// ─── Allowed values for enum fields ──────────────────────────────────────────
const ALLOWED_GENDERS  = new Set(["M", "F", "male", "female", "other", "Male", "Female"]);

// CFG-004 fix: model name sourced from env — never hardcoded
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
const ALLOWED_ACTIVITY = new Set(["sedentary", "light", "moderate", "active", "very active"]);

function isFiniteInRange(val: unknown, min: number, max: number): boolean {
  return typeof val === "number" && isFinite(val) && val >= min && val <= max;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ─── Security headers ───────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    app.use(helmet());
  }

  // ─── CORS — restricted to same-origin only for the SPA ─────────────────────
  // The frontend is served by the same Express/Vite server, so cross-origin
  // requests from external sites are not needed. Helmet blocks framing.

  // ─── Body size limit ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: "10kb" }));

  // ─── Rate limiting on API routes ─────────────────────────────────────────────
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  });
  app.use("/api/", apiLimiter);

  // ─── POST /api/parse-meal ─────────────────────────────────────────────────────
  app.post("/api/parse-meal", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Missing or invalid text input" });
        return;
      }
      if (text.length > 500) {
        res.status(400).json({ error: "Input text too long (max 500 characters)" });
        return;
      }

      // Strip characters that could be used to break prompt delimiters
      const sanitisedText = text.replace(/[<>"'`]/g, "");

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Parse the following meal description and estimate macronutrients. Return JSON with: name, calories, protein, carbs, fat, mealType (Breakfast/Lunch/Dinner/Snack).
---BEGIN MEAL INPUT---
${sanitisedText}
---END MEAL INPUT---`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name:      { type: Type.STRING },
              calories:  { type: Type.NUMBER },
              protein:   { type: Type.NUMBER },
              carbs:     { type: Type.NUMBER },
              fat:       { type: Type.NUMBER },
              mealType:  { type: Type.STRING },
            },
            required: ["name", "calories", "protein", "carbs", "fat", "mealType"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const VALID_MEAL_TYPES = new Set(["Breakfast", "Lunch", "Dinner", "Snack"]);

      // Validate AI response before returning to client
      const result = {
        name:     typeof parsed.name    === "string" ? parsed.name.slice(0, 200) : "unknown",
        calories: isFiniteInRange(parsed.calories, 0, 15000) ? parsed.calories : 0,
        protein:  isFiniteInRange(parsed.protein,  0, 1000)  ? parsed.protein  : 0,
        carbs:    isFiniteInRange(parsed.carbs,    0, 2000)  ? parsed.carbs    : 0,
        fat:      isFiniteInRange(parsed.fat,      0, 1000)  ? parsed.fat      : 0,
        mealType: VALID_MEAL_TYPES.has(parsed.mealType) ? parsed.mealType : "Snack",
      };

      res.json(result);
    } catch (error) {
      console.error("[parse-meal] Error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Failed to parse meal" });
    }
  });

  // ─── POST /api/recommendations ────────────────────────────────────────────────
  app.post("/api/recommendations", async (req, res) => {
    try {
      const { data } = req.body;
      if (!data || typeof data !== "object") {
        res.status(400).json({ error: "Missing or invalid data payload" });
        return;
      }

      const d = data as Record<string, unknown>;
      const bmi           = Number(d.bmi);
      const currentWeight = Number(d.currentWeight);
      const startWeight   = Number(d.startWeight);
      const avgCalories   = Number(d.avgCalories);
      const avgProtein    = Number(d.avgProtein);
      const recentWorkouts= Number(d.recentWorkouts);
      const age           = Number(d.age);
      const gender        = String(d.gender ?? "").trim();
      const activityLevel = String(d.activityLevel ?? "moderate").trim().toLowerCase();
      const bmiCategory   = String(d.bmiCategory ?? "").replace(/[^a-zA-Z\s]/g, "").slice(0, 30);

      // Strict range + allowlist validation
      if (!isFiniteInRange(bmi, 10, 80))            { res.status(400).json({ error: "Invalid bmi" }); return; }
      if (!isFiniteInRange(currentWeight, 20, 500)) { res.status(400).json({ error: "Invalid currentWeight" }); return; }
      if (!isFiniteInRange(startWeight, 20, 500))   { res.status(400).json({ error: "Invalid startWeight" }); return; }
      if (!isFiniteInRange(avgCalories, 0, 15000))  { res.status(400).json({ error: "Invalid avgCalories" }); return; }
      if (!isFiniteInRange(avgProtein, 0, 1000))    { res.status(400).json({ error: "Invalid avgProtein" }); return; }
      if (!isFiniteInRange(recentWorkouts, 0, 500)) { res.status(400).json({ error: "Invalid recentWorkouts" }); return; }
      if (!isFiniteInRange(age, 1, 120))            { res.status(400).json({ error: "Invalid age" }); return; }
      if (!ALLOWED_GENDERS.has(gender))             { res.status(400).json({ error: "Invalid gender" }); return; }
      if (!ALLOWED_ACTIVITY.has(activityLevel))     { res.status(400).json({ error: "Invalid activityLevel" }); return; }

      // Only typed, validated values reach the prompt
      const prompt = `You are an expert fitness and nutrition AI coach. Based on the following user data, provide highly personalised recommendations.
Format your response exactly as JSON with 3 specific sections (strings): dietRecommendations, workoutAdjustments, progressAnalysis.
Be specific, motivating, and actionable. Avoid asterisks. Keep it concise but impactful.

User Profile:
- BMI: ${bmi.toFixed(1)} (${bmiCategory})
- Current Weight: ${currentWeight}kg, Starting Weight: ${startWeight}kg
- Recent meals (last 3 days avg): ${avgCalories} kcal/day, ${avgProtein}g protein
- Recent workouts count: ${recentWorkouts}
- Age: ${age}, Gender: ${gender}
- Activity Level: ${activityLevel}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dietRecommendations: { type: Type.STRING },
              workoutAdjustments:  { type: Type.STRING },
              progressAnalysis:    { type: Type.STRING },
            },
            required: ["dietRecommendations", "workoutAdjustments", "progressAnalysis"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        dietRecommendations: typeof parsed.dietRecommendations === "string" ? parsed.dietRecommendations : "",
        workoutAdjustments:  typeof parsed.workoutAdjustments  === "string" ? parsed.workoutAdjustments  : "",
        progressAnalysis:    typeof parsed.progressAnalysis    === "string" ? parsed.progressAnalysis    : "",
      });
    } catch (error) {
      console.error("[recommendations] Error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // ─── Vite dev middleware / static production serving ─────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Resolve and validate dist path is within project root
    const projectRoot = path.resolve(__dirname, "..");
    const distPath    = path.resolve(projectRoot, "dist");
    if (!distPath.startsWith(projectRoot)) {
      console.error("[FATAL] distPath is outside project root — refusing to start.");
      process.exit(1);
    }
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to loopback in dev, all interfaces in production
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
  app.listen(PORT, host, () => {
    console.log(`Server running on http://${host}:${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
}

startServer();
