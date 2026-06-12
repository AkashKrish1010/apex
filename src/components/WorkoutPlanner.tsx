import { useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore, ExerciseEntry } from '@/store';
import { EXERCISES } from '@/constants';
import { Plus, Check, Trash2, Dumbbell } from 'lucide-react';

export default function WorkoutPlanner() {
  const { addWorkout, state } = useAppStore();
  const [session, setSession] = useState<ExerciseEntry[]>([]);
  const [filter, setFilter] = useState('All');
  const [savedMsg, setSavedMsg] = useState(false);

  const categories = ['All', ...Array.from(new Set(EXERCISES.map(e => e.group)))];
  const filteredLibrary = filter === 'All' ? EXERCISES : EXERCISES.filter(e => e.group === filter);

  const addToSession = (ex: typeof EXERCISES[0]) => {
    const id = crypto.randomUUID();
    setSession(prev => [...prev, { ...ex, id, completed: false, weight: 0 }]);
  };

  const updateSessionExercise = (id: string, updates: Partial<ExerciseEntry>) => {
    setSession(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeSessionExercise = (id: string) => {
    setSession(prev => prev.filter(e => e.id !== id));
  };

  const toggleComplete = (id: string) => {
    setSession(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const handleFinish = () => {
    if (session.length === 0) return;
    
    // Simplistic calorie calc: 5-10 cals per min depending on type
    const cals = session.reduce((acc, ex) => {
      const multiplier = ex.group === 'Cardio' || ex.group === 'HIIT' ? 10 : 6;
      return acc + (ex.duration * multiplier);
    }, 0);

    addWorkout({
      date: new Date().toISOString(),
      exercises: session,
      totalCalories: cals
    });
    
    // burst animation
    gsap.fromTo(".finish-btn", 
      { scale: 0.9 },
      { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.3)" }
    );
    
    setSession([]);
    // Show inline save confirmation instead of alert()
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <section className="relative w-full min-h-screen pt-24 pb-12 px-4 bg-dark overflow-hidden z-10 flex flex-col items-center">
      <div className="max-w-4xl w-full relative z-10">
        
        <div className="mb-10">
          <h2 className="bebas text-5xl md:text-7xl text-white">WORKOUT PLANNER</h2>
          <p className="font-mono text-lime-400 mt-2 uppercase text-xs">Break a sweat. Break records.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          
          {/* Left: Library */}
          <div className="flex flex-col h-[400px] lg:h-[600px]">
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar shrink-0 scrollbar-thin">
              {categories.map(c => (
                <button 
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`px-4 py-1.5 bebas tracking-wider text-sm border transition-all whitespace-nowrap ${filter === c ? 'bg-white text-dark border-white' : 'bg-transparent text-gray-400 border-dark-border hover:border-gray-500'}`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredLibrary.map((ex, i) => (
                <div key={i} className="flex items-center justify-between bg-dark-surface border border-dark-border p-3 group hover:border-lime-400 transition-colors">
                  <div>
                    <div className="bebas text-lg md:text-xl text-white group-hover:text-lime-400 transition-colors">{ex.name}</div>
                    <div className="font-mono text-[10px] text-gray-500 flex gap-2 uppercase">
                      <span>{ex.group}</span>
                      <span>{ex.sets}x{ex.reps}</span>
                      <span>{ex.duration}m</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => addToSession(ex)}
                    className="w-8 h-8 flex items-center justify-center border border-dark-border group-hover:border-lime-400 group-hover:bg-lime-400 group-hover:text-dark transition-all rounded"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Today's Session & History */}
          <div className="flex flex-col gap-6">
            <div className="bg-dark p-4 md:p-6 border border-dark-border flex flex-col h-[400px] lg:h-[450px] relative">
              <h3 className="bebas text-2xl md:text-3xl mb-4 flex items-center justify-between pb-3 border-b border-dark-border">
                TODAY'S WORKOUT
                <span className="text-lime-400 text-lg">{session.length} MOVES</span>
              </h3>

              {session.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 opacity-50">
                  <Dumbbell size={48} className="mb-4" />
                  <p className="font-mono uppercase text-[10px] max-w-[150px]">Build your session from the library to start.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin session-list">
                  {session.map((ex) => (
                    <div key={ex.id} className={`p-3 border transition-colors bg-dark-surface relative ${ex.completed ? 'border-lime-400/30 opacity-70' : 'border-dark-border'}`}>
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleComplete(ex.id)}
                            className={`w-5 h-5 border flex items-center justify-center transition-colors ${ex.completed ? 'bg-lime-400 border-lime-400 text-dark' : 'border-gray-500 text-transparent'}`}
                          >
                            <Check size={12} />
                          </button>
                          <span className={`bebas text-lg md:text-xl transition-all ${ex.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                            {ex.name}
                          </span>
                        </div>
                        <button onClick={() => removeSessionExercise(ex.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className={`grid grid-cols-4 gap-1 transition-all ${ex.completed ? 'opacity-50 pointer-events-none' : ''}`}>
                        {[
                          { label: 'SETS', field: 'sets' as keyof ExerciseEntry },
                          { label: 'REPS', field: 'reps' as keyof ExerciseEntry },
                          { label: 'WT', field: 'weight' as keyof ExerciseEntry },
                          { label: 'MINS', field: 'duration' as keyof ExerciseEntry }
                        ].map(input => (
                          <div key={input.field}>
                            <label className="block font-mono text-[8px] text-gray-500 mb-0.5">{input.label}</label>
                            <input 
                              type="number"
                              value={ex[input.field] as number}
                              onChange={(e) => updateSessionExercise(ex.id, { [input.field]: Number(e.target.value) })}
                              className="w-full bg-dark border border-dark-border p-1.5 font-mono text-center text-xs focus:border-lime-400 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={handleFinish}
                disabled={session.length === 0}
                className="finish-btn mt-4 w-full bg-lime-400 text-dark bebas text-xl py-3 hover:bg-lime-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                FINISH WORKOUT
              </button>
              {savedMsg && (
                <p className="text-lime-400 font-mono text-xs text-center mt-2 animate-pulse">
                  WORKOUT SAVED SUCCESSFULLY
                </p>
              )}
            </div>

            {/* History */}
            <div className="bg-dark-surface border border-dark-border p-4 h-[150px] overflow-y-auto pr-1 scrollbar-thin">
              <h4 className="font-mono text-[10px] text-gray-500 mb-3 uppercase">Workout History</h4>
              <div className="space-y-2">
                {[...state.workouts].reverse().map(w => (
                  <div key={w.id} className="flex justify-between items-center bg-dark p-2 border border-dark-border">
                    <div>
                      <div className="font-mono text-[9px] text-gray-500">{new Date(w.date).toLocaleDateString()}</div>
                      <div className="font-bebas text-base text-white">{w.exercises.length} EXERCISES</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lime-400 font-bebas text-lg">{w.totalCalories} KCAL</div>
                    </div>
                  </div>
                ))}
                {state.workouts.length === 0 && (
                  <div className="text-center font-mono text-[10px] text-gray-500">NO HISTORY YET</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
