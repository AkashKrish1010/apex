import { useState, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore } from '@/store';
import { Trash2 } from 'lucide-react';

export default function WeightTracker() {
  const { state, addWeightLog, deleteWeightLog } = useAppStore();
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [inputError, setInputError] = useState('');
  const pathRef = useRef<SVGPathElement>(null);

  const history = state.weightHistory;
  
  const stats = useMemo(() => {
    if (history.length === 0) return { current: state.profile.weight, start: state.profile.weight, diff: 0 };
    const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const start = sorted[0].weight;
    const current = sorted[sorted.length - 1].weight;
    return { start, current, diff: current - start };
  }, [history, state.profile.weight]);

  const handleLog = () => {
    const w = parseFloat(weightInput);
    // Validate weight: must be a positive finite number within human range
    if (!weightInput || !isFinite(w) || w <= 0 || w > 700) {
      setInputError('Enter a valid weight between 0.1 and 700.');
      return;
    }
    // Validate date: must parse correctly
    const parsedDate = new Date(dateInput);
    if (!dateInput || isNaN(parsedDate.getTime())) {
      setInputError('Enter a valid date.');
      return;
    }
    setInputError('');
    addWeightLog(w, dateInput);
    setWeightInput('');
  };

  // SVG Chart generation
  const chartData = useMemo(() => {
    if (history.length < 2) return null;
    const padding = 20;
    const w = 400; // smaller for mobile baseline
    const h = 250;
    
    const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let minW = Math.min(...sorted.map(s => s.weight)) - 5;
    let maxW = Math.max(...sorted.map(s => s.weight)) + 5;
    if (minW === maxW) {
      minW -= 5;
      maxW += 5;
    }
    const startTime = new Date(sorted[0].date).getTime();
    const endTime = new Date(sorted[sorted.length - 1].date).getTime();
    const timeSpan = endTime - startTime || 1;

    const points = sorted.map(d => {
      const x = padding + ((new Date(d.date).getTime() - startTime) / timeSpan) * (w - padding * 2);
      const y = h - padding - ((d.weight - minW) / (maxW - minW)) * (h - padding * 2);
      return { x, y, ...d };
    });

    const d = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    
    return { points, d, w, h };
  }, [history]);

  useGSAP(() => {
    if (chartData && pathRef.current) {
      const length = pathRef.current.getTotalLength();
      gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length });
      
      gsap.to(pathRef.current, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: "power2.out",
        delay: 0.2
      });
      
      gsap.from(".chart-dot", {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "back.out(2)",
        delay: 0.2
      });
    }
  }, [chartData]);


  return (
    <section className="relative w-full min-h-screen pt-24 pb-12 px-4 bg-dark overflow-x-hidden z-10 flex flex-col items-center">

      <div className="max-w-4xl w-full relative z-10">
        <div className="flex flex-col mb-10 gap-6">
          <div>
            <h2 className="bebas text-5xl md:text-7xl text-lime-400">WEIGHT TRACKER</h2>
            <p className="font-mono text-gray-400 mt-2 uppercase text-xs">Track every fluctuation. Own your progress.</p>
          </div>

          {/* Stats */}
          <div className="flex gap-8 border-l-2 border-lime-400 pl-4">
            <div>
              <div className="text-[10px] font-mono text-gray-500 mb-1">CURRENT</div>
              <div className="bebas text-3xl">{stats.current}<span className="text-lg text-gray-400 ml-1">{state.profile.unitSystem === 'metric' ? 'KG' : 'LBS'}</span></div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-500 mb-1">CHANGE</div>
              <div className={`bebas text-3xl ${stats.diff > 0 ? 'text-red-400' : stats.diff < 0 ? 'text-lime-400' : 'text-white'}`}>
                {stats.diff > 0 ? '+' : ''}{stats.diff.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          
          {/* Logger */}
          <div className="bg-dark-surface p-5 border border-dark-border w-full">
            <h3 className="bebas text-2xl mb-4 text-white">LOG WEIGHT</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <input 
                  type="date" 
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                  className="w-full bg-dark border border-dark-border p-3 text-white focus:border-lime-400 outline-none text-sm"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="flex-1">
                <input 
                  type="number" 
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  placeholder="75.5"
                  className="w-full bg-dark border border-dark-border p-3 text-white focus:border-lime-400 outline-none text-sm"
                />
              </div>
            </div>
            <button 
              onClick={handleLog}
              className="w-full mt-3 bg-lime-400 text-dark bebas text-xl py-2 hover:bg-lime-300 transition-colors"
            >
              SAVE LOG
            </button>
            {inputError && (
              <p className="text-red-400 font-mono text-xs mt-2">{inputError}</p>
            )}
            <div className="mt-6 flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
              {[...history].reverse().map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 border border-dark-border bg-dark group">
                  <div>
                    <div className="text-[10px] font-mono text-gray-500">{new Date(log.date).toLocaleDateString()}</div>
                    <div className="font-bebas text-xl text-white">{log.weight}</div>
                  </div>
                  <button onClick={() => deleteWeightLog(log.id)} className="text-red-500 hover:text-white transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-dark-surface border border-dark-border p-4 min-h-[260px] flex items-center justify-center w-full">
            {chartData ? (
              <svg viewBox={`0 0 ${chartData.w} ${chartData.h}`} className="w-full h-full text-white overflow-visible">
                {/* Grind lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(i => (
                  <line 
                    key={i} 
                    x1="20" y1={20 + i * (chartData.h - 40)} 
                    x2={chartData.w - 20} y2={20 + i * (chartData.h - 40)} 
                    stroke="#333" strokeDasharray="2 2" 
                  />
                ))}
                
                <path 
                  ref={pathRef}
                  d={chartData.d} 
                  fill="none" 
                  stroke="#ccff00" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round" 
                />
                {chartData.points.map((p, i) => (
                  <g key={i} className="chart-dot transform transition-transform hover:scale-125">
                    <circle cx={p.x} cy={p.y} r="5" fill="#111" stroke="#ccff00" strokeWidth="2" />
                    <text x={p.x} y={p.y - 10} fill="white" fontSize="10" textAnchor="middle" opacity="0" className="hover:opacity-100 transition-opacity font-mono">{p.weight}</text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="text-gray-500 font-mono text-xs text-center p-4">
                Log at least two weight entries to generate progress chart.
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
