import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import BottomNav from '@/components/BottomNav';
import Hero from '@/components/Hero';
import BmiCalculator from '@/components/BmiCalculator';
import WeightTracker from '@/components/WeightTracker';
import DietPlanner from '@/components/DietPlanner';
import WorkoutPlanner from '@/components/WorkoutPlanner';
import AiRecommendations from '@/components/AiRecommendations';
import Dashboard from '@/components/Dashboard';

function TopBar() {
  return (
    <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-none mix-blend-difference">
      <div className="bebas text-3xl md:text-5xl text-lime-400 tracking-wider">APEX</div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="relative w-full min-h-screen bg-dark text-white selection:bg-lime-400 selection:text-dark pb-20 md:pb-24">
        <div className="noise-overlay" />
        <TopBar />
        
        <main className="w-full flex-col min-h-screen">
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/bmi" element={<BmiCalculator />} />
            <Route path="/weight" element={<WeightTracker />} />
            <Route path="/diet" element={<DietPlanner />} />
            <Route path="/workout" element={<WorkoutPlanner />} />
            <Route path="/ai" element={<AiRecommendations />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
