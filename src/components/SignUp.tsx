import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/authStore';
import { Eye, EyeOff, User, Mail, Lock, Calendar, Zap, ArrowRight, CheckCircle } from 'lucide-react';

interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  autoComplete?: string;
}

function InputField({ id, label, type, value, onChange, placeholder, icon, error, autoComplete }: InputFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="auth-field-wrapper">
      <label htmlFor={id} className="auth-label">{label}</label>
      <div className={`auth-input-container ${error ? 'auth-input-error' : ''}`}>
        <span className="auth-input-icon">{icon}</span>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="auth-input"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="auth-eye-btn"
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  );
}

function StrengthBar({ password }: { password: string }) {
  const getStrength = (p: string) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  if (!password) return null;
  const score = getStrength(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#ccff00'];

  return (
    <div className="auth-strength-bar-wrapper">
      <div className="auth-strength-bars">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="auth-strength-segment"
            style={{ backgroundColor: i <= score ? colors[score] : '#222' }}
          />
        ))}
      </div>
      <span className="auth-strength-label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 120) e.age = 'Age must be between 10 and 120.';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate async

    const result = await signUp(name, email, parseInt(age), password);
    setLoading(false);

    if (!result.success) {
      setServerError(result.error || 'Sign up failed.');
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Zap size={22} className="text-dark" />
          </div>
          <span className="auth-brand-name">APEX</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join APEX and unlock your peak performance</p>
        </div>

        {success ? (
          <div className="auth-success-state">
            <CheckCircle size={48} className="text-lime-400 mx-auto mb-4" />
            <p className="auth-success-text">Account created successfully!</p>
            <p className="auth-success-sub">Redirecting you now…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {serverError && (
              <div className="auth-server-error">
                <span>{serverError}</span>
              </div>
            )}

            <InputField
              id="signup-name"
              label="Full Name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Alex Johnson"
              icon={<User size={16} />}
              error={errors.name}
              autoComplete="name"
            />

            <InputField
              id="signup-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="alex@example.com"
              icon={<Mail size={16} />}
              error={errors.email}
              autoComplete="email"
            />

            <InputField
              id="signup-age"
              label="Age"
              type="number"
              value={age}
              onChange={setAge}
              placeholder="25"
              icon={<Calendar size={16} />}
              error={errors.age}
              autoComplete="off"
            />

            <div>
              <InputField
                id="signup-password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Min. 6 characters"
                icon={<Lock size={16} />}
                error={errors.password}
                autoComplete="new-password"
              />
              <StrengthBar password={password} />
            </div>

            <InputField
              id="signup-confirm"
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter password"
              icon={<Lock size={16} />}
              error={errors.confirm}
              autoComplete="new-password"
            />

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="auth-switch-text">
              Already have an account?{' '}
              <button
                type="button"
                id="goto-login-btn"
                onClick={() => navigate('/login')}
                className="auth-switch-link"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
