import { useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore } from '@/store';
import { Trash2, Sparkles, Loader2, Apple, Flame, Plus } from 'lucide-react';
import { API_URL } from '@/constants';

function calcCalorieGoal(profile: { age: number; weight: number; height: number; gender: string; unitSystem: 'metric' | 'imperial' }): number {
  const { age, weight, height, gender, unitSystem } = profile;
  const wKg = unitSystem === 'metric' ? weight : weight * 0.453592;
  const hCm = unitSystem === 'metric' ? height : height * 2.54;
  const bmr = gender === 'F'
    ? (10 * wKg) + (6.25 * hCm) - (5 * age) - 161
    : (10 * wKg) + (6.25 * hCm) - (5 * age) + 5;
  const goal = Math.round(bmr * 1.55);
  return Math.min(4000, Math.max(1200, goal));
}

export default function DietPlanner() {
  const { state, addMeal, deleteMeal } = useAppStore();
  const [nlInput, setNlInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [parseError, setParseError] = useState('');

  const CALORIE_GOAL = calcCalorieGoal(state.profile);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysMeals = state.meals.filter(m => m.date === todayStr);
  const filteredMeals = filter === 'All' ? todaysMeals : todaysMeals.filter(m => m.mealType === filter);

  const totals = todaysMeals.reduce((acc, m) => ({
    cal: acc.cal + m.calories,
    pro: acc.pro + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat
  }), { cal: 0, pro: 0, carbs: 0, fat: 0 });

  // Estimated goals for macros based on calorie distribution (e.g. 30% protein, 45% carbs, 25% fat)
  const macroGoals = {
    pro: Math.round((CALORIE_GOAL * 0.30) / 4),
    carbs: Math.round((CALORIE_GOAL * 0.45) / 4),
    fat: Math.round((CALORIE_GOAL * 0.25) / 9),
  };

  const handleParseMeal = async () => {
    if (!nlInput.trim()) return;
    if (nlInput.length > 500) {
      setParseError('Input too long — please keep it under 500 characters.');
      return;
    }
    setParseError('');
    setIsParsing(true);
    try {
      const res = await fetch(`${API_URL}/api/parse-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlInput })
      });
      if (!res.ok) {
        setParseError('Could not parse meal. Please try again.');
        return;
      }
      const data = await res.json();

      if (data.isValidFood === false || data.name === 'invalid') {
        alert('Please enter a valid meal description or food item.');
      } else if (data.name) {
        addMeal({
          name: data.name,
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          mealType: data.mealType || 'Snack',
          date: todayStr
        });
        setNlInput('');
      }
    } catch {
      setParseError('Failed to parse meal. Check your connection and try again.');
    } finally {
      setIsParsing(false);
    }
  };

  useGSAP(() => {
    gsap.fromTo(".meal-card",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" }
    );
  }, [filteredMeals.length, filter]);

  return (
    <section className="relative w-full min-h-screen pt-24 md:pt-28 pb-16 px-6 lg:px-8 bg-darker overflow-hidden z-10 flex flex-col items-center">
      
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-1/3 left-10 w-[40vw] h-[40vw] bg-lime-400 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 w-[35vw] h-[35vw] bg-emerald-700 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl w-full relative z-10">
        
        {/* Header */}
        <div className="mb-12 border-b border-dark-border pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="bebas text-5xl sm:text-6xl md:text-7xl text-white tracking-wider">DIET PLANNING</h2>
            <p className="font-mono text-lime-400 mt-2 uppercase text-xs tracking-widest flex items-center gap-2">
              <Apple size={14} /> Fuel the machinery. Optimize core telemetry.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-dark/40 border border-dark-border px-6 py-3 rounded-2xl backdrop-blur-md">
            <div>
              <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">TOTAL LOGGED</div>
              <div className="bebas text-2xl text-white">{totals.cal} <span className="text-sm font-mono text-lime-400">kcal</span></div>
            </div>
            <div className="h-8 w-[1px] bg-dark-border/60" />
            <div>
              <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">CALORIE GOAL</div>
              <div className="bebas text-2xl text-lime-400">{CALORIE_GOAL} <span className="text-sm font-mono text-lime-400/80">kcal</span></div>
            </div>
          </div>
        </div>

        {/* Layout Grid (Left: col-span-4, Right: col-span-8) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Logging & Fuel Stats (Spans 5 cols on lg for breathing room) */}
          <div className="lg:col-span-5 space-y-6">

            {/* AI Natural Language Logger */}
            <div className="bg-dark/45 border border-dark-border rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Sparkles size={120} className="text-lime-400" />
              </div>
              <h3 className="bebas text-2xl text-lime-400 mb-2 flex items-center gap-2 tracking-wide">
                <Sparkles size={18} /> AI COGNITIVE LOGGING
              </h3>
              <p className="text-[10px] font-mono text-gray-500 mb-4 uppercase tracking-widest">Type naturally. The matrix extracts all macronutrients.</p>

              <textarea
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                placeholder="e.g. I had two bananas, a cup of Greek yogurt, and 30g of raw almonds for breakfast..."
                className="w-full h-32 bg-dark-surface/80 border border-dark-border/80 rounded-xl p-4 text-white focus:border-lime-400 outline-none resize-none mb-4 font-sans text-xs transition-colors leading-relaxed placeholder:text-gray-600"
              />

              <button
                onClick={handleParseMeal}
                disabled={isParsing || !nlInput}
                className="w-full bg-lime-400 text-dark rounded-xl bebas text-xl py-3 hover:bg-lime-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.15)] active:scale-[0.99] transform"
              >
                {isParsing ? (
                  <><Loader2 className="animate-spin" size={18} /> ANALYZING PARAMETERS...</>
                ) : (
                  <><Plus size={18} /> LOG MEAL</>
                )}
              </button>
              {parseError && (
                <p className="text-red-400 font-mono text-[10px] mt-3 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">{parseError}</p>
              )}
            </div>

            {/* Daily Fuel Tracker */}
            <div className="bg-dark/45 border border-dark-border rounded-2xl p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <h3 className="bebas text-2xl mb-6 text-white tracking-wide flex items-center gap-2">
                <Flame size={18} className="text-lime-400" /> FUEL TELEMETRY
              </h3>

              {/* Calories progress display */}
              <div className="mb-8">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-mono text-xs text-gray-400 tracking-wider">CALORIES INTAKE</span>
                  <div className="bebas text-3xl text-white">
                    {totals.cal} <span className="text-xs font-mono text-gray-500">/ {CALORIE_GOAL} KCAL</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-dark-surface rounded-full overflow-hidden shadow-inner flex">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (totals.pro * 4 / CALORIE_GOAL) * 100)}%` }} />
                  <div className="h-full bg-yellow-500" style={{ width: `${Math.min(100, (totals.carbs * 4 / CALORIE_GOAL) * 100)}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (totals.fat * 9 / CALORIE_GOAL) * 100)}%` }} />
                </div>
              </div>

              {/* Detailed macro indicators */}
              <div className="space-y-4">
                
                {/* Protein */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1.5">
                    <span className="text-blue-400 font-semibold tracking-wider">PROTEIN (30%)</span>
                    <span className="text-gray-400">{totals.pro}g / {macroGoals.pro}g</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-surface rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (totals.pro / macroGoals.pro) * 100)}%` }} />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1.5">
                    <span className="text-yellow-400 font-semibold tracking-wider">CARBOHYDRATES (45%)</span>
                    <span className="text-gray-400">{totals.carbs}g / {macroGoals.carbs}g</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-surface rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (totals.carbs / macroGoals.carbs) * 100)}%` }} />
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] mb-1.5">
                    <span className="text-rose-400 font-semibold tracking-wider">LIPIDS/FAT (25%)</span>
                    <span className="text-gray-400">{totals.fat}g / {macroGoals.fat}g</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-surface rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (totals.fat / macroGoals.fat) * 100)}%` }} />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Column: Meal Database Grid (Spans 7 cols on lg) */}
          <div className="lg:col-span-7 w-full flex flex-col">

            {/* Filter Navigation Category Capsules */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin hide-scrollbar">
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2 bebas text-lg rounded-xl border transition-all duration-200 tracking-wider ${
                    filter === cat 
                      ? 'bg-lime-400 border-lime-400 text-dark shadow-[0_0_15px_rgba(204,255,0,0.25)]' 
                      : 'bg-dark/40 border-dark-border text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Meals Grid (Highly Responsive 2/3 Column Layout) */}
            <div className="meal-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredMeals.length === 0 ? (
                <div className="col-span-full py-24 rounded-2xl text-center font-mono text-xs text-gray-500 uppercase border border-dashed border-dark-border bg-dark/10">
                  No meals registered for this index today.
                </div>
              ) : (
                filteredMeals.map(meal => (
                  <div 
                    key={meal.id} 
                    className="meal-card bg-dark/45 border border-dark-border p-5 rounded-2xl hover:border-lime-400/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col justify-between"
                  >
                    
                    {/* Meal type badge */}
                    <div className="absolute top-0 right-0 bg-lime-400/10 border-l border-b border-lime-400/20 text-lime-400 font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-bl-xl">
                      {meal.mealType}
                    </div>

                    <div className="pt-2">
                      <h4 className="font-bebas text-2xl leading-none text-white tracking-wide mb-2 max-w-[85%] whitespace-nowrap overflow-hidden text-ellipsis">
                        {meal.name}
                      </h4>
                      <div className="bebas text-3xl text-lime-400 my-1">{meal.calories} <span className="text-xs font-mono uppercase tracking-widest text-lime-400/70">kcal</span></div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dark-border/40 flex justify-between font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                      <div>P: <span className="text-white font-bold">{meal.protein}g</span></div>
                      <div>C: <span className="text-white font-bold">{meal.carbs}g</span></div>
                      <div>F: <span className="text-white font-bold">{meal.fat}g</span></div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="absolute top-10 right-3 text-red-500/80 hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-115 p-1 bg-dark-surface/80 rounded-lg border border-dark-border/50"
                      aria-label={`Delete ${meal.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
