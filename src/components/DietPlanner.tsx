import { useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore } from '@/store';
import { Trash2, Sparkles, Loader2 } from 'lucide-react';

const CALORIE_GOAL = 2500;

export default function DietPlanner() {
  const { state, addMeal, deleteMeal } = useAppStore();
  const [nlInput, setNlInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [filter, setFilter] = useState('All');

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysMeals = state.meals.filter(m => m.date === todayStr);
  const filteredMeals = filter === 'All' ? todaysMeals : todaysMeals.filter(m => m.mealType === filter);

  const totals = todaysMeals.reduce((acc, m) => ({
    cal: acc.cal + m.calories,
    pro: acc.pro + m.protein,
    carbs: acc.carbs + m.carbs,
    fat: acc.fat + m.fat
  }), { cal: 0, pro: 0, carbs: 0, fat: 0 });

  const handleParseMeal = async () => {
    if (!nlInput) return;
    setIsParsing(true);
    try {
      const res = await fetch('/api/parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlInput })
      });
      const data = await res.json();
      
      if (data.name) {
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
    } catch(e) {
      console.error(e);
      alert('Failed to parse meal.');
    } finally {
      setIsParsing(false);
    }
  };

  useGSAP(() => {
    gsap.fromTo(".meal-card", 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
    );
  }, [filteredMeals.length, filter]);

  return (
    <section className="relative w-full min-h-screen pt-24 pb-12 px-4 bg-darker overflow-hidden z-10 flex flex-col items-center">
      <div className="max-w-4xl w-full relative z-10">
        
        <div className="mb-10">
          <h2 className="bebas text-5xl md:text-7xl text-white">DIET PLANNER</h2>
          <p className="font-mono text-lime-400 mt-2 uppercase text-xs">Fuel the machine.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: AI Input & Daily Macro Summary */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-dark p-5 border border-dark-border relative overflow-hidden group w-full">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sparkles size={80} />
              </div>
              <h3 className="bebas text-2xl text-lime-400 mb-2 flex items-center gap-2">
                <Sparkles size={20} /> AI LOGGING
              </h3>
              <p className="text-[10px] font-mono text-gray-400 mb-4 uppercase">Type naturally. We calculate the rest.</p>
              
              <textarea 
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                placeholder="e.g. 3 scrambled eggs with 2 slices of whole wheat toast..."
                className="w-full h-24 bg-dark-surface border border-dark-border p-3 text-white focus:border-lime-400 outline-none resize-none mb-4 font-sans text-xs"
              />
              
              <button 
                onClick={handleParseMeal}
                disabled={isParsing || !nlInput}
                className="w-full bg-lime-400 text-dark bebas text-lg py-2 hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isParsing ? <><Loader2 className="animate-spin" size={18} /> ANALYZING...</> : 'LOG MEAL'}
              </button>
            </div>

            <div className="bg-dark p-5 border border-dark-border w-full">
              <h3 className="bebas text-2xl mb-6 text-white">DAILY FUEL</h3>
              
              <div className="flex justify-between items-end mb-2">
                <div className="bebas text-4xl text-lime-400 tracking-wider w-full flex justify-between items-baseline">
                  {totals.cal}
                  <span className="font-mono text-[10px] text-gray-500 pb-1">/ {CALORIE_GOAL} KCAL</span>
                </div>
              </div>
              
              {/* Stacked bar */}
              <div className="w-full h-3 bg-dark-surface rounded-full overflow-hidden mb-6 flex">
                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(totals.pro * 4 / CALORIE_GOAL) * 100}%` }} />
                <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${(totals.carbs * 4 / CALORIE_GOAL) * 100}%` }} />
                <div className="h-full bg-red-400 transition-all duration-1000" style={{ width: `${(totals.fat * 9 / CALORIE_GOAL) * 100}%` }} />
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
                <div>
                  <div className="text-blue-500 mb-1">PRO</div>
                  <div className="text-white text-sm">{totals.pro}g</div>
                </div>
                <div>
                  <div className="text-yellow-400 mb-1">CARB</div>
                  <div className="text-white text-sm">{totals.carbs}g</div>
                </div>
                <div>
                  <div className="text-red-400 mb-1">FAT</div>
                  <div className="text-white text-sm">{totals.fat}g</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Meal Grid */}
          <div className="lg:col-span-2 w-full">
            
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar scrollbar-thin">
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 bebas text-lg border transition-all whitespace-nowrap ${filter === f ? 'bg-lime-400 border-lime-400 text-dark' : 'bg-transparent border-dark-border text-white hover:border-gray-500'}`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="meal-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMeals.length === 0 ? (
                <div className="col-span-full py-16 text-center font-mono text-xs text-gray-500 uppercase border border-dashed border-dark-border">
                  No meals logged for this category today.
                </div>
              ) : (
                filteredMeals.map(meal => (
                  <div key={meal.id} className="meal-card bg-dark border border-dark-border p-4 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-lime-400 text-dark font-bebas px-2 py-0.5 text-xs">
                      {meal.mealType}
                    </div>
                    
                    <h4 className="font-bebas text-xl mt-3 max-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis text-white">{meal.name}</h4>
                    <div className="bebas text-3xl text-lime-400 my-2">{meal.calories} KCAL</div>
                    
                    <div className="font-mono text-[10px] text-gray-400 flex gap-4 uppercase">
                      <span>P: <span className="text-white">{meal.protein}g</span></span>
                      <span>C: <span className="text-white">{meal.carbs}g</span></span>
                      <span>F: <span className="text-white">{meal.fat}g</span></span>
                    </div>

                    <button 
                      onClick={() => deleteMeal(meal.id)}
                      className="absolute bottom-3 right-3 text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    >
                      <Trash2 size={16} />
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
