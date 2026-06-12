import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore } from '@/store';
import { 
  Activity, 
  TrendingDown, 
  Utensils, 
  Dumbbell, 
  Zap, 
  LayoutDashboard, 
  ArrowRight, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { state } = useAppStore();

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Page wipe loader
    tl.to(".loader-overlay", {
      clipPath: "inset(0 0 100% 0)",
      duration: 1.2,
      ease: "power4.inOut",
      delay: 0.1
    });

    // Staggered title entrance
    tl.fromTo(".hero-word", 
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power4.out" },
      "-=0.4"
    );

    // Stagger sub and CTA buttons
    tl.fromTo([".hero-sub", ".hero-cta-group"],
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" },
      "-=0.5"
    );

    // Fade in and stagger cards
    tl.fromTo(".feature-card",
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: "power2.out" },
      "-=0.4"
    );

    // Stagger stats
    tl.fromTo(".stat-bar-item",
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      "-=0.3"
    );

  }, { scope: containerRef });

  const features = [
    {
      to: '/bmi',
      icon: Activity,
      title: 'BMI Calculator',
      desc: 'Accurately assess your body mass index with dual-system calibrations and index categorization.',
      tag: 'CALCULATE',
      color: 'border-lime-400/20 hover:border-lime-400/80'
    },
    {
      to: '/weight',
      icon: TrendingDown,
      title: 'Weight Tracker',
      desc: 'Log weight entries, visualize fluctuations, and capture automated BMI recalculation trends.',
      tag: 'MONITOR',
      color: 'border-lime-400/20 hover:border-lime-400/80'
    },
    {
      to: '/diet',
      icon: Utensils,
      title: 'Diet Planner',
      desc: 'Use advanced AI natural language parsing to instantly extract macro nutrients from simple meal text.',
      tag: 'NUTRITION',
      color: 'border-lime-400/20 hover:border-lime-400/80'
    },
    {
      to: '/workout',
      icon: Dumbbell,
      title: 'Workout Builder',
      desc: 'Create personalized workout templates, log your completed sessions, and monitor consistency.',
      tag: 'TRAINING',
      color: 'border-lime-400/20 hover:border-lime-400/80'
    },
    {
      to: '/ai',
      icon: Zap,
      title: 'AI Coaching',
      desc: 'Synchronize your training, nutrition, and weight metrics for deep, actionable fitness optimizations.',
      tag: 'AI GENERATED',
      color: 'border-lime-400/20 hover:border-lime-400/80'
    },
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      title: 'Performance Dash',
      desc: 'View comprehensive charts, average intake statistics, and unified telemetry of your health.',
      tag: 'TELEMETRY',
      color: 'border-lime-400/20 hover:border-lime-400/80'
    }
  ];

  return (
    <section ref={containerRef} className="relative w-full min-h-screen flex flex-col justify-start overflow-hidden bg-dark pt-12 md:pt-16 pb-20">
      {/* Black loader wipe */}
      <div className="loader-overlay absolute inset-0 z-50 bg-black" style={{ clipPath: 'inset(0 0 0% 0)' }} />

      {/* Dynamic background gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
        <div className="absolute top-10 left-10 w-[50vw] h-[50vw] bg-lime-400 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-10 right-10 w-[45vw] h-[45vw] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Decorative Badge */}
        <div className="hero-sub flex items-center gap-2 px-4 py-1.5 rounded-full border border-lime-400/30 bg-lime-400/5 text-lime-400 font-mono text-[10px] md:text-xs tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
          <Sparkles size={12} className="animate-spin-slow" />
          <span>PRO WORKSPACE ACTIVATED</span>
        </div>

        {/* Immersive Bold Typography Heading */}
        <h1 className="bebas text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] leading-none mb-6 text-center tracking-wide flex flex-col gap-1 overflow-hidden">
          <span className="hero-word block">ENGINEER YOUR BODY.</span>
          <span className="hero-word block text-lime-400">COMMAND YOUR PROGRESS.</span>
        </h1>

        <p className="hero-sub font-mono text-gray-400 text-xs sm:text-sm md:text-base mb-8 max-w-3xl text-center tracking-widest uppercase leading-relaxed">
          AI-driven tracking metrics. Immersive data structures. Brutal consistency. Unlock your ultimate performance parameters.
        </p>

        {/* Call to Actions */}
        <div className="hero-cta-group flex flex-col sm:flex-row gap-4 mb-16">
          <button 
            onClick={() => navigate('/dashboard')}
            className="relative inline-flex items-center justify-center gap-3 h-14 px-8 text-sm font-mono tracking-widest text-dark bg-lime-400 hover:bg-lime-300 transition-all rounded-lg font-bold shadow-[0_0_30px_rgba(204,255,0,0.25)] hover:shadow-[0_0_40px_rgba(204,255,0,0.4)] transform hover:-translate-y-0.5 group"
          >
            <span>ENTER WORKSPACE</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
          <button 
            onClick={() => navigate('/ai')}
            className="inline-flex items-center justify-center gap-2 h-14 px-8 text-sm font-mono tracking-widest text-white border border-dark-border bg-dark-surface/50 hover:bg-dark-surface/80 transition-all rounded-lg"
          >
            <Zap size={14} className="text-lime-400 animate-pulse" />
            <span>AI ENGINE INFERENCE</span>
          </button>
        </div>

        {/* User Stats Telemetry Overlay */}
        <div className="stat-bar-item w-full max-w-4xl bg-darker/65 border border-dark-border rounded-2xl p-6 mb-16 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-4 flex justify-between items-center">
            <span>LIVE BASELINE DATA METRICS</span>
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-dark-border/40">
            {[
              { label: 'CALCULATED BMI', val: state.profile.bmi || 'Not Configured' },
              { label: 'WORKOUTS COMPLETED', val: state.workouts.length },
              { label: 'DIET LOG ENTRIES', val: state.meals.length },
              { label: 'WEIGHT SAMPLES', val: state.weightHistory.length }
            ].map((stat, i) => (
              <div key={i} className={i > 1 ? "pt-4 md:pt-0 md:pl-4" : i > 0 ? "pl-0 md:pl-4" : "pr-4"}>
                <div className="text-[10px] font-mono text-gray-400 tracking-widest uppercase mb-1">{stat.label}</div>
                <div className="bebas text-2xl lg:text-3xl text-lime-400">{stat.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid (3 Columns Desktop) */}
        <div className="w-full max-w-5xl mt-8">
          <div className="text-center mb-10">
            <h2 className="bebas text-3xl sm:text-4xl text-white tracking-widest">APEX SUITE OPERATIONS</h2>
            <p className="font-mono text-[10px] text-gray-500 tracking-widest uppercase mt-1">Select an operational parameter to launch</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                onClick={() => navigate(feature.to)}
                className={`feature-card group cursor-pointer bg-darker/60 border ${feature.color} p-6 rounded-2xl transition-all duration-350 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm relative overflow-hidden`}
              >
                {/* Micro-glow highlight inside card */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-lime-400/5 rounded-full filter blur-[24px] group-hover:bg-lime-400/10 transition-colors" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-dark-surface/80 rounded-xl text-lime-400 border border-dark-border group-hover:border-lime-400/30 transition-colors">
                    <feature.icon size={20} />
                  </div>
                  <span className="font-mono text-[9px] text-gray-500 tracking-widest border border-dark-border px-2 py-0.5 rounded-full uppercase">
                    {feature.tag}
                  </span>
                </div>
                
                <h3 className="bebas text-2xl text-white mb-2 group-hover:text-lime-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="font-sans text-xs text-gray-400 leading-relaxed mb-4">
                  {feature.desc}
                </p>
                
                <div className="flex items-center gap-1 font-mono text-[10px] text-lime-400/80 group-hover:text-lime-400 font-bold transition-all uppercase tracking-widest mt-auto">
                  <span>LAUNCH TOOL</span>
                  <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Auto-scrolling ticker bottom */}
      <div className="absolute bottom-0 left-0 w-full bg-lime-400 text-dark py-2.5 font-mono text-xs font-black uppercase overflow-hidden whitespace-nowrap z-20 shadow-[0_-5px_20px_rgba(204,255,0,0.15)]">
        <div className="inline-block animate-[scroll_25s_linear_infinite] tracking-wider">
          SYSTEM STATUS: ONLINE — AI MATRIX INTEGRATED — DATA BASING ACTIVE — BMI DEVIATION REDUCED — TRAIN HARDER — LIVE SMARTER — SYSTEM STATUS: ONLINE — AI MATRIX INTEGRATED — DATA BASING ACTIVE — BMI DEVIATION REDUCED — TRAIN HARDER — LIVE SMARTER — 
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
