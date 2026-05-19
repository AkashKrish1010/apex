import { NavLink } from 'react-router-dom';
import { Home, Activity, TrendingDown, Utensils, Dumbbell, Zap, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/bmi', icon: Activity, label: 'BMI' },
    { to: '/weight', icon: TrendingDown, label: 'Weight' },
    { to: '/diet', icon: Utensils, label: 'Diet' },
    { to: '/workout', icon: Dumbbell, label: 'Workout' },
    { to: '/ai', icon: Zap, label: 'AI' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dash' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-darker/80 backdrop-blur-xl border-t border-dark-border z-50">
      <div className="flex items-center justify-between overflow-x-auto hide-scrollbar px-2 py-2 md:justify-center md:gap-8 max-w-lg mx-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 min-w-[56px] transition-all duration-300",
                isActive ? "text-lime-400 scale-110" : "text-gray-500 hover:text-white"
              )
            }
          >
            <link.icon size={20} className="mb-1" />
            <span className="text-[9px] font-mono tracking-widest uppercase">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
