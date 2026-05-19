import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAppStore } from '@/store';

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { state } = useAppStore();

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Page load animation: brief black overlay slides away 
    tl.to(".loader-overlay", {
      clipPath: "inset(0 0 100% 0)",
      duration: 1.2,
      ease: "power4.inOut",
      delay: 0.2
    });

    // Staggered text wipe
    tl.fromTo(".hero-word", 
      { y: 100, clipPath: "inset(0 0 100% 0)" },
      { y: 0, clipPath: "inset(0 0 0% 0)", duration: 1, stagger: 0.15, ease: "power4.out" },
      "-=0.5"
    );

    tl.fromTo(".hero-sub",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
      "-=0.5"
    );

    tl.fromTo(".hero-btn",
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
      "-=0.5"
    );

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden bg-dark">
      {/* Black loader overlay */}
      <div className="loader-overlay absolute inset-0 z-10 bg-black" style={{ clipPath: 'inset(0 0 0% 0)' }} />

      {/* Background gradients & shapes */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-1/4 left-1/4 w-[60vw] h-[60vw] bg-lime-400 rounded-full mix-blend-screen filter blur-[80px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-0 w-[50vw] h-[50vw] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow shadow-[0_0_100px_rgba(204,255,0,0.5)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 mt-12">
        {/* Massive headline */}
        <h1 className="bebas text-7xl md:text-[12rem] leading-none mb-6 flex flex-col md:flex-row gap-2 md:gap-4 overflow-hidden">
          <div className="flex gap-2 md:gap-4 justify-center">
            <span className="hero-word">TRAIN</span>
            <span className="hero-word">SMARTER.</span>
          </div>
          <div className="flex gap-2 md:gap-4 justify-center">
            <span className="hero-word text-lime-400">LIVE</span>
            <span className="hero-word text-lime-400">HARDER.</span>
          </div>
        </h1>

        <p className="hero-sub font-mono text-gray-400 text-xs md:text-lg mb-8 max-w-xl mx-auto tracking-widest uppercase">
          Ai-Enhanced tracking. Brutal consistency. Unstoppable progress.
        </p>

        <button 
          onClick={() => navigate('/bmi')}
          className="hero-btn relative inline-flex h-16 items-center justify-center px-10 py-3 text-lg font-bebas tracking-wide text-dark transition-all bg-lime-400 hover:bg-lime-300 transform hover:scale-105 group overflow-hidden mb-8"
        >
          <span className="relative z-10">START YOUR JOURNEY</span>
          <div className="absolute inset-0 h-full w-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
        </button>

        {/* User Stats Preview */}
        <div className="hero-sub grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl opacity-0">
          {[
            { label: 'CURRENT BMI', val: state.profile.bmi || '--' },
            { label: 'WORKOUTS', val: state.workouts.length },
            { label: 'MEALS LOGGED', val: state.meals.length },
            { label: 'WEIGHT LOGS', val: state.weightHistory.length }
          ].map((stat, i) => (
             <div key={i} className="bg-dark-surface/50 border border-dark-border p-3 backdrop-blur-sm flex flex-col justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
               <div className="text-[10px] font-mono text-gray-400 mb-1 tracking-widest">{stat.label}</div>
               <div className="bebas text-2xl lg:text-3xl text-lime-400">{stat.val}</div>
             </div>
          ))}
        </div>
      </div>

      {/* Auto-scrolling ticker */}
      <div className="absolute bottom-0 left-0 w-full bg-lime-400 text-dark py-2 font-mono text-sm font-bold uppercase overflow-hidden whitespace-nowrap z-20">
        <div className="inline-block animate-[scroll_20s_linear_infinite]">
          BMI TRACKING — DIET PLANNING — AI COACHING — WORKOUT ROUTINES — PROGRESS ANALYTICS — BMI TRACKING — DIET PLANNING — AI COACHING — WORKOUT ROUTINES — PROGRESS ANALYTICS — 
          BMI TRACKING — DIET PLANNING — AI COACHING — WORKOUT ROUTINES — PROGRESS ANALYTICS — 
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
