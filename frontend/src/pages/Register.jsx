import { useMemo, useState } from 'react';
import { ArrowRight, Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPasswordStrength, registerUser } from '../services/auth';
import { notify } from '../utils/toast';
import BrandLogo from '../components/brand/BrandLogo';
import AuthRailwayScene from '../components/brand/AuthRailwayScene';

const initialForm = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: 'Operations Analyst',
  agree: false,
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.fullName || !form.email || !form.username || !form.password || !form.confirmPassword) {
      setError('Please complete all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!form.agree) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }

    try {
      setSubmitting(true);
      registerUser({
        fullName: form.fullName,
        email: form.email,
        username: form.username,
        password: form.password,
        role: form.role,
      });

      notify({ type: 'success', message: 'Account created successfully.' });
      navigate('/login', { state: { role: form.role } });
    } catch (err) {
      setError(err.message || 'Unable to create account.');
      notify({ type: 'error', message: err.message || 'Unable to create account.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-panel login-panel--hero">
        <div className="login-brand">
          <BrandLogo />
          <p className="login-tagline">Smarter Planning. <span>Stronger Railways.</span></p>
          <p className="login-intro">Railway logistics planning and decision support platform for operations, routing, inventory and fleet optimization.</p>
        </div>

        <div className="login-visual">
          <AuthRailwayScene />
        </div>

        <div className="stat-grid">
          <div className="stat-chip">
            <ShieldCheck size={18} />
            <div>
              <strong>Secure</strong>
              <span>Protected access</span>
            </div>
          </div>
          <div className="stat-chip">
            <Building2 size={18} />
            <div>
              <strong>Enterprise</strong>
              <span>Operations UI</span>
            </div>
          </div>
          <div className="stat-chip">
            <ArrowRight size={18} />
            <div>
              <strong>Live</strong>
              <span>Decision workflow</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-panel login-panel--form">
        <div className="auth-card">
          <div className="auth-card__heading">
            <div className="badge-pill">Create account</div>
            <h1>Create your account</h1>
            <p>Register to access the RAKE FORMATION decision support system.</p>
          </div>

          {error ? <div className="notice notice--error">{error}</div> : null}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Full Name</span>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Vikram Sharma"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="name@company.com"
              />
            </label>

            <label>
              <span>Username</span>
              <input
                type="text"
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="vsharma"
              />
            </label>

            <label>
              <span>Role</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option>Operations Analyst</option>
                <option>Logistics Manager</option>
                <option>Planner</option>
                <option>Approver</option>
                <option>Operations Manager</option>
              </select>
            </label>

            <label>
              <span>Password</span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Create a secure password"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label>
              <span>Confirm Password</span>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder="Confirm your password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {form.password ? (
              <div className="auth-row">
                <span>Password strength</span>
                <strong>{strength.label}</strong>
              </div>
            ) : null}

            <label className="checkbox-row" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(event) => setForm((current) => ({ ...current, agree: event.target.checked }))}
              />
              <span>I agree to the terms and conditions</span>
            </label>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-note" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button type="button" className="link-button" onClick={() => navigate('/login')}>
              Already have an account? Sign in
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Building2 size={16} />
              <span>RAKE FORMATION Decision Support System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
