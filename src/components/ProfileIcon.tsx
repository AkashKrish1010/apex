import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, UserAccount } from '@/authStore';
import { User, Mail, Calendar, LogOut, ChevronDown, Shield, X } from 'lucide-react';

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-avatar" aria-label="Profile avatar">
      <span className="profile-avatar-initials">{initials}</span>
      <div className="profile-avatar-ring" />
    </div>
  );
}

interface ProfilePanelProps {
  user: UserAccount;
  onClose: () => void;
  onLogout: () => void;
}

function ProfilePanel({ user, onClose, onLogout }: ProfilePanelProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleLogout = () => {
    onClose();
    onLogout();
    navigate('/login');
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="profile-panel-overlay">
      <div ref={panelRef} className="profile-panel" role="dialog" aria-label="Profile panel">
        {/* Close button */}
        <button
          id="profile-panel-close-btn"
          onClick={onClose}
          className="profile-panel-close"
          aria-label="Close profile"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="profile-panel-header">
          <div className="profile-panel-avatar-large">
            <span className="profile-panel-initials">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
            <div className="profile-panel-avatar-glow" />
          </div>
          <h2 className="profile-panel-name">{user.name}</h2>
          <div className="profile-panel-badge">
            <Shield size={10} />
            <span>APEX MEMBER</span>
          </div>
        </div>

        {/* Divider */}
        <div className="profile-panel-divider" />

        {/* Info rows */}
        <div className="profile-panel-info">
          <div className="profile-info-row">
            <div className="profile-info-icon"><Mail size={14} /></div>
            <div className="profile-info-content">
              <span className="profile-info-label">Email</span>
              <span className="profile-info-value">{user.email}</span>
            </div>
          </div>

          <div className="profile-info-row">
            <div className="profile-info-icon"><Calendar size={14} /></div>
            <div className="profile-info-content">
              <span className="profile-info-label">Age</span>
              <span className="profile-info-value">{user.age} years old</span>
            </div>
          </div>

          <div className="profile-info-row">
            <div className="profile-info-icon"><User size={14} /></div>
            <div className="profile-info-content">
              <span className="profile-info-label">Member Since</span>
              <span className="profile-info-value">{memberSince}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="profile-panel-divider" />

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="profile-logout-btn"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default function ProfileIcon() {
  const { auth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!auth.isAuthenticated || !auth.currentUser) {
    return (
      <button
        id="go-to-login-topbar-btn"
        onClick={() => navigate('/login')}
        className="profile-login-btn"
        aria-label="Sign in"
      >
        <User size={18} />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <>
      <button
        id="profile-icon-btn"
        onClick={() => setOpen(o => !o)}
        className="profile-trigger-btn"
        aria-label="Open profile"
        aria-expanded={open}
      >
        <Avatar name={auth.currentUser.name} />
        <ChevronDown
          size={14}
          className="profile-chevron"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <ProfilePanel
          user={auth.currentUser}
          onClose={() => setOpen(false)}
          onLogout={logout}
        />
      )}
    </>
  );
}
