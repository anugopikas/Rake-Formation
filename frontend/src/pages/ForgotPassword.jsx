import { useState } from 'react';
import { ArrowRight, Building2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../services/auth';
import { notify } from '../utils/toast';
import BrandLogo from '../components/brand/BrandLogo';
import AuthRailwayScene from '../components/brand/AuthRailwayScene';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const result = requestPasswordReset(email);
      setSuccess(result.message || 'Reset request captured.');
      notify({ type: 'success', message: 'Password reset request recorded.' });
    } catch (err) {
      setError(err.message || 'Unable to send the reset request.');
      notify({ type: 'error', message: err.message || 'Unable to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-panel login-panel--hero">
        <div className="login-brand">
          <BrandLogo />
          <p className="login-tagline">Smarter Planning. <span>Stronger Railways.</span></p>
          <p className="login-intro">Reset access for your railway operations account. This form is ready for an actual backend reset endpoint when you wire it in.</p>
        </div>

        <div className="login-visual">
          <AuthRailwayScene />
        </div>

        <div className="stat-grid">
          <div className="stat-chip">
            <Mail size={18} />
            <div>
              <strong>Reset</strong>
              <span>Secure access</span>
            </div>
          </div>
          <div className="stat-chip">
            <Building2 size={18} />
            <div>
              <strong>Ops</strong>
              <span>Recovery flow</span>
            </div>
          </div>
          <div className="stat-chip">
            <ArrowRight size={18} />
            <div>
              <strong>Ready</strong>
              <span>Backend hook</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-panel login-panel--form">
        <div className="auth-card">
          <div className="auth-card__heading">
            <div className="badge-pill">Password recovery</div>
            <h1>Reset your password</h1>
            <p>Enter your email to receive a reset link.</p>
          </div>

          {error ? <div className="notice notice--error">{error}</div> : null}
          {success ? <div className="notice notice--success">{success}</div> : null}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
              />
            </label>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-note" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button type="button" className="link-button" onClick={() => navigate('/login')}>
              Back to sign in
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
