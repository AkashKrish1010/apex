import { useAppStore } from '@/store';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useMemo, useRef } from 'react';

export default function Dashboard() {
  const { state } = useAppStore();
  const containerRef = useRef<HTMLElement>(null);

  const stats = useMemo(() => {
    return {
      workouts: state.workouts.length,
      caloriesBurned: state.workouts.reduce((a, b) => a + b.totalCalories, 0),
      avgBmi: state.profile.bmi || 0,
      daysTracked: state.weightHistory.length
    };
  }, [state]);

  const macroTotals = useMemo(() => {
    const totals = state.meals.reduce((acc, m) => ({
      p: acc.p + m.protein,
      c: acc.c + m.carbs,
      f: acc.f + m.fat
    }), { p: 0, c: 0, f: 0 });
    const sum = totals.p + totals.c + totals.f || 1;
    return {
      p: totals.p / sum,
      c: totals.c / sum,
      f: totals.f / sum
    };
  }, [state.meals]);

  const heatmapCells = useMemo(() => {
    const arr = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const hasActivity = 
        state.workouts.some(w => {
          try {
            const wDateStr = new Date(w.date).toISOString().split('T')[0];
            return wDateStr === dateStr;
          } catch {
            return false;
          }
        }) ||
        state.meals.some(m => {
          try {
            const mDateStr = new Date(m.date).toISOString().split('T')[0];
            return mDateStr === dateStr;
          } catch {
            return false;
          }
        }) ||
        state.weightHistory.some(wh => {
          try {
            const whDateStr = new Date(wh.date).toISOString().split('T')[0];
            return whDateStr === dateStr;
          } catch {
            return false;
          }
        });
      arr.push({ active: hasActivity });
    }
    return arr;
  }, [state.workouts, state.meals, state.weightHistory]);

  useGSAP(() => {
    // Stat counters
    const counters = gsap.utils.toArray('.stat-counter') as HTMLElement[];
    counters.forEach(counter => {
      const target = parseFloat(counter.getAttribute('data-target') || '0');
      gsap.to(counter, {
        innerHTML: target,
        duration: 1.5,
        ease: "power2.out",
        delay: 0.1,
        snap: { innerHTML: 1 },
        onUpdate: function() {
          if ((target % 1) !== 0) {
            counter.innerHTML = Number(this.targets()[0].innerHTML).toFixed(1);
          }
        }
      });
    });

    // Donut chart stroke reveal
    gsap.fromTo('.donut-segment', 
      { strokeDasharray: "0 100" },
      { 
        strokeDasharray: (i, target) => `${target.getAttribute('data-value')} 100`,
        duration: 2, 
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.2
      }
    );

  }, [stats]);


  return (
    <section ref={containerRef} className="relative w-full min-h-screen pt-24 pb-12 px-4 bg-dark overflow-hidden z-10 flex flex-col items-center">
      <div className="max-w-4xl w-full mx-auto relative z-10">
        
        <div className="mb-10">
          <h2 className="bebas text-5xl md:text-7xl text-white">COMMAND CENTER</h2>
          <p className="font-mono text-gray-400 mt-2 uppercase text-xs">The hard data.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'WORKOUTS', val: stats.workouts },
            { label: 'CALS BURNED', val: stats.caloriesBurned },
            { label: 'CURRENT BMI', val: stats.avgBmi },
            { label: 'DAYS TRACKED', val: stats.daysTracked },
          ].map((s, i) => (
            <div key={i} className="bg-dark border border-dark-border p-4 border-l-4 border-l-lime-400">
              <div className="text-[10px] font-mono text-gray-500 mb-1">{s.label}</div>
              <div className="bebas text-4xl text-white stat-counter" data-target={s.val}>0</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Macro Donut */}
          <div className="bg-dark border border-dark-border p-6 flex flex-col items-center justify-center">
            <h3 className="bebas text-xl w-full text-left mb-6 text-white">MACRO DISTRIBUTION</h3>
            <div className="relative w-36 h-36 donut-svg">
              <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 origin-center drop-shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#222" strokeWidth="6" />
                
                {/* Protein */}
                <circle className="donut-segment transition-all" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                  stroke="#ccff00" strokeWidth="6" 
                  strokeDasharray="0 100" strokeDashoffset="25" 
                  data-value={macroTotals.p * 100} 
                />
                {/* Carbs */}
                <circle className="donut-segment transition-all" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                  stroke="#3b82f6" strokeWidth="6" 
                  strokeDasharray="0 100" strokeDashoffset={25 - (macroTotals.p * 100)} 
                  data-value={macroTotals.c * 100} 
                />
                {/* Fat */}
                <circle className="donut-segment transition-all" cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                  stroke="#ef4444" strokeWidth="6" 
                  strokeDasharray="0 100" strokeDashoffset={25 - ((macroTotals.p + macroTotals.c) * 100)} 
                  data-value={macroTotals.f * 100} 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <div className="bebas text-2xl text-lime-400">{state.meals.length}</div>
                <div className="font-mono text-[9px] text-gray-500">MEALS</div>
              </div>
            </div>
            <div className="flex gap-4 mt-6 font-mono text-[10px] text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-lime-400"></span> PRO</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> CARB</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> FAT</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-dark border border-dark-border p-6 flex flex-col">
            <h3 className="bebas text-xl w-full text-left mb-6 text-white">WORKOUT HEATMAP (LAST 30 DAYS)</h3>
            <div className="grid grid-cols-7 gap-1 md:gap-2 flex-grow">
              {heatmapCells.map((cell, i) => {
                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-sm border transition-all duration-500 ${cell.active ? 'bg-lime-400 border-lime-400 shadow-[0_0_5px_rgba(204,255,0,0.5)]' : 'bg-dark-surface border-dark-border'}`}
                  />
                );
              })}
            </div>
            <p className="mt-6 font-mono text-[9px] text-gray-500 text-right uppercase">Consistency is the only variable that matters.</p>
          </div>

        </div>
      </div>
    </section>
  );
}
