import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Activity, TrendingDown, Utensils, Dumbbell, Zap, LayoutDashboard } from 'lucide-react';
import ProfileIcon from './ProfileIcon';
import { cn } from '@/lib/utils';

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/bmi', icon: Activity, label: 'BMI' },
    { to: '/weight', icon: TrendingDown, label: 'Weight' },
    { to: '/diet', icon: Utensils, label: 'Diet' },
    { to: '/workout', icon: Dumbbell, label: 'Workout' },
    { to: '/ai', icon: Zap, label: 'AI Coach' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-darker/60 backdrop-blur-md border-b border-dark-border z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="bebas text-3xl md:text-4xl text-lime-400 tracking-wider hover:opacity-85 transition-opacity">
              APEX
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "relative px-3 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-300 rounded-lg flex items-center gap-2",
                    isActive 
                      ? "text-lime-400 bg-lime-400/5 font-semibold" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )
                }
              >
                <link.icon size={14} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-4">
            {/* Profile trigger */}
            <div className="pointer-events-auto">
              <ProfileIcon />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer (Slide down menu) */}
      <div 
        className={cn(
          "absolute top-full left-0 w-full bg-darker/95 backdrop-blur-lg border-b border-dark-border transition-all duration-350 ease-in-out overflow-hidden md:hidden z-40",
          isOpen ? "max-h-[50vh] opacity-100 py-4" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="px-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase tracking-wider rounded-lg transition-colors",
                  isActive 
                    ? "text-lime-400 bg-lime-400/5 font-bold" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )
              }
            >
              <link.icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
