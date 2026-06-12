import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import Hero from '@/components/Hero';
import BmiCalculator from '@/components/BmiCalculator';
import WeightTracker from '@/components/WeightTracker';
import DietPlanner from '@/components/DietPlanner';
import WorkoutPlanner from '@/components/WorkoutPlanner';
import AiRecommendations from '@/components/AiRecommendations';
import Dashboard from '@/components/Dashboard';
import SignUp from '@/components/SignUp';
import Login from '@/components/Login';
import ProfileIcon from '@/components/ProfileIcon';
import { useAuthStore } from '@/authStore';

function TopBar() {
  return (
    <div className="fixed top-0 left-0 w-full px-4 py-4 flex justify-between items-center z-50">
      <div className="bebas text-3xl md:text-5xl text-lime-400 tracking-wider mix-blend-difference pointer-events-none">
        APEX
      </div>
      <div className="pointer-events-auto">
        <ProfileIcon />
      </div>
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

// Protect routes — redirect to login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuthStore();
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Redirect to home if already logged in
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuthStore();
  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Auth routes — no TopBar/BottomNav */}
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignUp />
            </GuestRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        {/* Protected app routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
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
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
