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
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem('apex_fitness_data');
      return stored ? JSON.parse(stored) : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    localStorage.setItem('apex_fitness_data', JSON.stringify(state));
  }, [state]);

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
    setState(s => ({
      ...s,
      weightHistory: [...s.weightHistory, { id: Date.now().toString(), date, weight }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      profile: { ...s.profile, weight }
    }));
    // Recalculate BMI based on new weight via recursive update
    updateProfile({ weight });
  };

  const deleteWeightLog = (id: string) => {
    setState(s => ({ ...s, weightHistory: s.weightHistory.filter(w => w.id !== id) }));
  };

  const addMeal = (meal: Omit<MealEntry, 'id'>) => {
    setState(s => ({
      ...s,
      meals: [...s.meals, { ...meal, id: Date.now().toString() }]
    }));
  };

  const deleteMeal = (id: string) => {
    setState(s => ({ ...s, meals: s.meals.filter(m => m.id !== id) }));
  };

  const addWorkout = (workout: Omit<WorkoutSession, 'id'>) => {
    setState(s => ({
      ...s,
      workouts: [...s.workouts, { ...workout, id: Date.now().toString() }]
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
