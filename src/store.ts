import { useState, useEffect } from 'react';

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: string;
  date: string;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number; // in mins
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: ExerciseEntry[];
  totalCalories: number;
}

export interface AppState {
  profile: {
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    unitSystem: 'metric' | 'imperial';
    bmi: number;
  };
  weightHistory: WeightEntry[];
  meals: MealEntry[];
  workouts: WorkoutSession[];
}

const defaultState: AppState = {
  profile: {
    name: '',
    age: 25,
    gender: 'M',
    height: 180,
    weight: 75,
    unitSystem: 'metric',
    bmi: 0,
  },
  weightHistory: [],
  meals: [],
  workouts: [],
};

export function useAppStore() {
  const userId = localStorage.getItem('apex_session') || 'guest';
  const storeKey = `apex_fitness_data_${userId}`;

  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(storeKey);
      let parsed: AppState | null = stored ? JSON.parse(stored) : null;

      if (userId !== 'guest') {
        const accountsRaw = localStorage.getItem('apex_accounts');
        const accounts = accountsRaw ? JSON.parse(accountsRaw) : [];
        const user = accounts.find((a: any) => a.id === userId);
        if (user) {
          if (!parsed) {
            parsed = {
              ...defaultState,
              profile: {
                ...defaultState.profile,
                name: user.name,
                age: user.age,
              },
            };
          } else {
            parsed.profile = {
              ...parsed.profile,
              name: parsed.profile.name || user.name,
              age: parsed.profile.age || user.age,
            };
          }
        }
      }

      return parsed || defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    localStorage.setItem(storeKey, JSON.stringify(state));
  }, [state, storeKey]);

  const updateProfile = (profileUpdate: Partial<AppState['profile']>) => {
    setState(s => {
      const newProfile = { ...s.profile, ...profileUpdate };
      
      // Calculate BMI
      let bmi = 0;
      if (newProfile.height > 0 && newProfile.weight > 0) {
        if (newProfile.unitSystem === 'metric') {
          bmi = newProfile.weight / Math.pow(newProfile.height / 100, 2);
        } else {
          bmi = (newProfile.weight / Math.pow(newProfile.height, 2)) * 703;
        }
      }
      
      return { ...s, profile: { ...newProfile, bmi: Number(bmi.toFixed(1)) } };
    });
  };

  const addWeightLog = (weight: number, date: string) => {
    // Input validation: weight must be a positive finite number within reasonable human range
    if (!isFinite(weight) || weight <= 0 || weight > 700) return;
    // Date must be a valid date string (not in the future beyond 1 day for typo tolerance)
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return;
    setState(s => ({
      ...s,
      weightHistory: [...s.weightHistory, { id: crypto.randomUUID(), date, weight }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      profile: { ...s.profile, weight }
    }));
    // Recalculate BMI based on new weight via recursive update
    updateProfile({ weight });
  };

  const deleteWeightLog = (id: string) => {
    if (!id || typeof id !== 'string') return;
    setState(s => ({ ...s, weightHistory: s.weightHistory.filter(w => w.id !== id) }));
  };

  const addMeal = (meal: Omit<MealEntry, 'id'>) => {
    setState(s => ({
      ...s,
      meals: [...s.meals, { ...meal, id: crypto.randomUUID() }]
    }));
  };

  const deleteMeal = (id: string) => {
    if (!id || typeof id !== 'string') return;
    setState(s => ({ ...s, meals: s.meals.filter(m => m.id !== id) }));
  };

  const addWorkout = (workout: Omit<WorkoutSession, 'id'>) => {
    setState(s => ({
      ...s,
      workouts: [...s.workouts, { ...workout, id: crypto.randomUUID() }]
    }));
  };

  return {
    state,
    updateProfile,
    addWeightLog,
    deleteWeightLog,
    addMeal,
    deleteMeal,
    addWorkout
  };
}
