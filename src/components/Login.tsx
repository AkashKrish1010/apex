import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/authStore';
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight } from 'lucide-react';

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

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 700));

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setServerError(result.error || 'Login failed.');
      return;
    }

    navigate('/');
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue your fitness journey</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {serverError && (
            <div className="auth-server-error">
              <span>{serverError}</span>
            </div>
          )}

          <InputField
            id="login-email"
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
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Your password"
            icon={<Lock size={16} />}
            error={errors.password}
            autoComplete="current-password"
          />

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="auth-switch-text">
            Don't have an account?{' '}
            <button
              type="button"
              id="goto-signup-btn"
              onClick={() => navigate('/signup')}
              className="auth-switch-link"
            >
              Create Account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
