import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore } from '@/store';
import { Loader2, Zap } from 'lucide-react';
import { API_URL } from '@/constants';

interface RecData {
  dietRecommendations: string;
  workoutAdjustments: string;
  progressAnalysis: string;
}

export default function AiRecommendations() {
  const { state } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecData | null>(null);
  const [recError, setRecError] = useState('');
  
  const contentRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    setLoading(true);
    
    // Calculate 3-day avg
    const last3Days = state.meals.slice(-10); // simplistic fetch
    const avgCal = last3Days.reduce((a, b) => a + b.calories, 0) / (last3Days.length || 1);
    const avgPro = last3Days.reduce((a, b) => a + b.protein, 0) / (last3Days.length || 1);
    const wHistory = [...state.weightHistory].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startW = wHistory[0]?.weight || state.profile.weight;

    const payload = {
      bmi: state.profile.bmi,
      bmiCategory: 'Calculated', // can refine
      currentWeight: state.profile.weight,
      startWeight: startW,
      avgCalories: Math.round(avgCal),
      avgProtein: Math.round(avgPro),
      recentWorkouts: state.workouts.length,
      age: state.profile.age,
      gender: state.profile.gender
    };

    try {
      const res = await fetch(`${API_URL}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });
      if (!res.ok) {
        setRecError('Could not generate recommendations. Please try again.');
        return;
      }
      const json = await res.json();
      setRecError('');
      setData(json);
    } catch {
      // Never expose raw errors — show a generic message
      setRecError('Failed to connect. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useGSAP(() => {
    if (data && contentRef.current) {
      // Typewriter effect approach:
      // Animate opacity of child elements in sequence
      const cards = contentRef.current.querySelectorAll('.rec-card');
      gsap.fromTo(cards, 
        { autoAlpha: 0, rotationX: -90, transformOrigin: "50% 0%" },
        { autoAlpha: 1, rotationX: 0, duration: 0.8, stagger: 0.3, ease: "back.out(1.2)" }
      );
    }
  }, [data]);

  return (
    <section className="relative w-full min-h-screen pt-24 pb-12 px-4 bg-darker overflow-hidden z-10 flex flex-col items-center">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] bg-lime-400 rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none z-0" />

      <div className="max-w-4xl w-full relative z-10 mb-10 text-center">
        <h2 className="bebas text-5xl md:text-7xl text-white mb-2">AI COACH</h2>
        <p className="font-mono text-gray-400 uppercase text-xs">Data ingested. Strategies generated.</p>
        
        {!data && (
           <button 
             onClick={generate}
             disabled={loading}
             className="mt-8 relative w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 font-bebas text-xl md:text-2xl tracking-wide text-dark bg-lime-400 hover:bg-lime-300 transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 uppercase overflow-hidden ring-2 ring-lime-400/20"
           >
             {loading ? <><Loader2 className="animate-spin mr-3" /> ANALYZING VITAL DATA...</> : <><Zap className="mr-2" /> GENERATE INSIGHTS</>}
           </button>
        )}
        {recError && (
          <p className="text-red-400 font-mono text-xs mt-4">{recError}</p>
        )}
      </div>

      {data && (
        <div ref={contentRef} className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 perspective-[1000px] z-10 pb-8">
          
          {[
            { title: 'DIET MODS', content: data.dietRecommendations, id: 'diet' },
            { title: 'TRAINING SHIFTS', content: data.workoutAdjustments, id: 'workout' },
            { title: 'PROGRESS AUDIT', content: data.progressAnalysis, id: 'progress' }
          ].map((item, i) => (
            <div key={i} className="rec-card bg-dark border border-lime-400/30 p-6 shadow-[0_0_30px_rgba(204,255,0,0.05)] relative overflow-hidden group hover:border-lime-400 transition-colors flex flex-col gap-3">
              <div className="absolute top-0 left-0 w-full h-1 bg-lime-400 opacity-20 group-hover:opacity-100 transition-opacity" />
              <h3 className="bebas text-2xl text-lime-400">{item.title}</h3>
              <p className="font-sans text-gray-300 leading-relaxed text-sm">
                {item.content}
              </p>
            </div>
          ))}
          
          <div className="col-span-full flex justify-center mt-6">
            <button 
              onClick={generate}
              disabled={loading}
              className="text-lime-400 font-mono text-xs uppercase hover:underline flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />} 
              {loading ? 'RE-ANALYZING...' : 'RECALCULATE'}
            </button>
          </div>

        </div>
      )}
    </section>
  );
}
