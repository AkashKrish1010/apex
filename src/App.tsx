import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Hero from '@/components/Hero';
import BmiCalculator from '@/components/BmiCalculator';
import WeightTracker from '@/components/WeightTracker';
import DietPlanner from '@/components/DietPlanner';
import WorkoutPlanner from '@/components/WorkoutPlanner';
import AiRecommendations from '@/components/AiRecommendations';
import Dashboard from '@/components/Dashboard';
import SignUp from '@/components/SignUp';
import Login from '@/components/Login';
import { useAuthStore } from '@/authStore';

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
              <div className="relative w-full min-h-screen bg-dark text-white selection:bg-lime-400 selection:text-dark pt-16 md:pt-20">
                <div className="noise-overlay" />
                <NavBar />
                <main className="w-full flex-col min-h-screen animate-fade-in">
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
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
