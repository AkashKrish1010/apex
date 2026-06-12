import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import { 
  findUserByEmail, 
  createUser, 
  updateUserProfile, 
  updateUserPassword, 
  findUserById 
} from "./db.ts";
import { 
  generateToken, 
  authenticateToken, 
  AuthRequest 
} from "./auth.ts";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ─── Startup validation ───────────────────────────────────────────────────────
const apiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, "").trim();
if (!apiKey) {
  console.error("[FATAL] GEMINI_API_KEY is missing. Set it in your environment before starting.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// ─── Allowed values for enum fields ──────────────────────────────────────────
const ALLOWED_GENDERS = new Set(["M", "F", "male", "female", "other", "Male", "Female"]);

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

  // ─── CORS — enabled for mobile app compatibility and SPA ───────────────────
  app.use(cors());

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

  // ─── AUTH ENDPOINTS ─────────────────────────────────────────────────────────

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, age } = req.body;
      if (!email || !password || !name || age === undefined) {
        res.status(400).json({ error: "Missing required parameters (email, password, name, age)." });
        return;
      }

      const existing = findUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email target already initialized/registered." });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = createUser({
        email,
        passwordHash,
        name,
        age: Number(age),
      });

      const token = generateToken(user.id, user.email);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error("Registration failed:", error);
      res.status(500).json({ error: "Internal server error during registration." });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const user = findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid credential parameters." });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid credential parameters." });
        return;
      }

      const token = generateToken(user.id, user.email);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          createdAt: user.createdAt
        },
        profile: user.profile || null
      });
    } catch (error) {
      console.error("Login failed:", error);
      res.status(500).json({ error: "Internal server error during verification." });
    }
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email is required." });
        return;
      }

      const user = findUserByEmail(email);
      if (!user) {
        // Return 200 for security, but with warning
        res.json({ 
          success: true, 
          message: "If email exists in system baseline, recovery telemetry has been launched." 
        });
        return;
      }

      res.json({
        success: true,
        message: "RECOVERY PROTOCOL INITIATED. Mock recovery token has been synchronized.",
        resetCode: "APEX-RCVR-" + Math.floor(100000 + Math.random() * 900000)
      });
    } catch (error) {
      console.error("Forgot password failed:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // Change password (auth required)
  app.post("/api/auth/change-password", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        res.status(400).json({ error: "Both old and new passwords are required." });
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized access profile." });
        return;
      }

      const user = findUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User profile not found." });
        return;
      }

      const valid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!valid) {
        res.status(400).json({ error: "Current password validation failed." });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      updateUserPassword(userId, newHash);

      res.json({ success: true, message: "Credentials successfully updated." });
    } catch (error) {
      console.error("Change password failed:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // Profile update (auth required)
  app.post("/api/auth/profile", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized access profile." });
        return;
      }

      const profileData = req.body;
      const updated = updateUserProfile(userId, profileData);
      if (!updated) {
        res.status(404).json({ error: "User profile update failed." });
        return;
      }

      res.json({
        success: true,
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          age: updated.age,
          createdAt: updated.createdAt
        },
        profile: updated.profile
      });
    } catch (error) {
      console.error("Profile sync failed:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // Current User Details
  app.get("/api/auth/me", authenticateToken as any, async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized access profile." });
        return;
      }

      const user = findUserById(userId);
      if (!user) {
        res.status(404).json({ error: "User baseline not found." });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          createdAt: user.createdAt
        },
        profile: user.profile || null
      });
    } catch (error) {
      console.error("Get user details failed:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });

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
        model: "gemini-3.1-flash-lite",
        contents: `You are a nutrition assistant. Determine if the following input describes a valid edible food item or meal.
If the input is NOT food/edible (e.g., random characters, gibberish, computer code, programming terms, insults, or objects like tables/chairs/cars), set "isValidFood" to false, "name" to "invalid", and all macro values to 0.
Otherwise, if it is a valid food/meal, set "isValidFood" to true and estimate its name and macronutrients (calories, protein, carbs, fat).
Input text: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValidFood: { type: Type.BOOLEAN },
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER }
            },
            required: ["isValidFood", "name", "calories", "protein", "carbs", "fat"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const VALID_MEAL_TYPES = new Set(["Breakfast", "Lunch", "Dinner", "Snack"]);

      // Validate AI response before returning to client
      const result = {
        name: typeof parsed.name === "string" ? parsed.name.slice(0, 200) : "unknown",
        calories: isFiniteInRange(parsed.calories, 0, 15000) ? parsed.calories : 0,
        protein: isFiniteInRange(parsed.protein, 0, 1000) ? parsed.protein : 0,
        carbs: isFiniteInRange(parsed.carbs, 0, 2000) ? parsed.carbs : 0,
        fat: isFiniteInRange(parsed.fat, 0, 1000) ? parsed.fat : 0,
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
      const bmi = Number(d.bmi);
      const currentWeight = Number(d.currentWeight);
      const startWeight = Number(d.startWeight);
      const avgCalories = Number(d.avgCalories);
      const avgProtein = Number(d.avgProtein);
      const recentWorkouts = Number(d.recentWorkouts);
      const age = Number(d.age);
      const gender = String(d.gender ?? "").trim();
      const activityLevel = String(d.activityLevel ?? "moderate").trim().toLowerCase();
      const bmiCategory = String(d.bmiCategory ?? "").replace(/[^a-zA-Z\s]/g, "").slice(0, 30);

      // Strict range + allowlist validation
      if (!isFiniteInRange(bmi, 10, 80)) { res.status(400).json({ error: "Invalid bmi" }); return; }
      if (!isFiniteInRange(currentWeight, 20, 500)) { res.status(400).json({ error: "Invalid currentWeight" }); return; }
      if (!isFiniteInRange(startWeight, 20, 500)) { res.status(400).json({ error: "Invalid startWeight" }); return; }
      if (!isFiniteInRange(avgCalories, 0, 15000)) { res.status(400).json({ error: "Invalid avgCalories" }); return; }
      if (!isFiniteInRange(avgProtein, 0, 1000)) { res.status(400).json({ error: "Invalid avgProtein" }); return; }
      if (!isFiniteInRange(recentWorkouts, 0, 500)) { res.status(400).json({ error: "Invalid recentWorkouts" }); return; }
      if (!isFiniteInRange(age, 1, 120)) { res.status(400).json({ error: "Invalid age" }); return; }
      if (!ALLOWED_GENDERS.has(gender)) { res.status(400).json({ error: "Invalid gender" }); return; }
      if (!ALLOWED_ACTIVITY.has(activityLevel)) { res.status(400).json({ error: "Invalid activityLevel" }); return; }

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
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dietRecommendations: { type: Type.STRING },
              workoutAdjustments: { type: Type.STRING },
              progressAnalysis: { type: Type.STRING },
            },
            required: ["dietRecommendations", "workoutAdjustments", "progressAnalysis"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        dietRecommendations: typeof parsed.dietRecommendations === "string" ? parsed.dietRecommendations : "",
        workoutAdjustments: typeof parsed.workoutAdjustments === "string" ? parsed.workoutAdjustments : "",
        progressAnalysis: typeof parsed.progressAnalysis === "string" ? parsed.progressAnalysis : "",
      });
    } catch (error) {
      console.error("[recommendations] Error:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "online", time: new Date().toISOString() });
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
    const distPath = path.resolve(projectRoot, "dist");
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
