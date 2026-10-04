import { useEffect, useState } from 'react';
import { ArrowRight, Boxes, Building2, Eye, EyeOff, LockKeyhole, Mail, MapPin, Route, ShieldCheck, TrainFront, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import BrandLogo from '../components/brand/BrandLogo';

const highlights = [
  { label: 'Real-time operations', detail: 'Monitor railway operations efficiently.', icon: Zap },
  { label: 'Intelligent planning', detail: 'Improve rake planning and allocation.', icon: Route },
  { label: 'Fleet optimization', detail: 'Manage wagons and capacity effectively.', icon: Boxes },
];

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', role: location.state?.role || 'Operations Analyst', remember: true });
  const [showPassword, setShowPassword] = useState(false);
  const [metrics, setMetrics] = useState({ orders: 'N/A', fleet: 'N/A', plans: 'N/A' });

  useEffect(() => {
    let ignore = false;
    Promise.all([apiRequest('/orders/'), apiRequest('/wagons/'), apiRequest('/rake-plans/')])
      .then(([orders, wagons, plans]) => {
        if (!ignore) {
          setMetrics({
            orders: Array.isArray(orders) ? orders.length.toLocaleString() : 'N/A',
            fleet: Array.isArray(wagons) && wagons.length ? `${wagons.length}` : 'N/A',
            plans: Array.isArray(plans) ? plans.length.toLocaleString() : 'N/A',
          });
        }
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin(form.email, form.password, form.role);
  };

  return (
    <div className="login-shell">
      <div className="login-panel login-panel--hero">
        <div className="login-brand">
          <BrandLogo />
          <p className="login-tagline">Smarter Planning. <span>Stronger Railways.</span></p>
          <p className="login-intro">Enterprise railway operations and decision support for planning, inventory, and fleet optimization.</p>
        </div>

        <div className="stat-grid">
          {highlights.map(({ label, detail, icon: Icon }) => (
            <div key={label} className="stat-chip">
              <Icon size={18} />
              <div>
                <strong>{label}</strong>
                <span>{detail}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="login-visual">
          <div className="railway-scene" aria-label="Railway logistics network illustration">
            <div className="scene-sun" />
            <div className="scene-network">
              <span className="network-line network-line--one" />
              <span className="network-line network-line--two" />
              <span className="network-line network-line--three" />
              <span className="network-node network-node--one"><MapPin size={16} /></span>
              <span className="network-node network-node--two"><TrainFront size={16} /></span>
              <span className="network-node network-node--three"><Boxes size={16} /></span>
              <span className="network-node network-node--four"><Zap size={16} /></span>
            </div>
            <div className="railway-track railway-track--one" />
            <div className="railway-track railway-track--two" />
            <div className="freight-train">
              <div className="locomotive"><span /><i /><b /></div>
              <div className="freight-wagon freight-wagon--blue" />
              <div className="freight-wagon freight-wagon--cyan" />
              <div className="freight-wagon freight-wagon--navy" />
              <div className="freight-wagon freight-wagon--steel" />
            </div>
          </div>
        </div>
        <div className="metric-strip">
          <div><TrainFront size={18} /><strong>{metrics.orders}</strong><span>Live Orders</span></div>
          <div><ShieldCheck size={18} /><strong>{metrics.fleet}</strong><span>Fleet Tracked</span></div>
          <div><Route size={18} /><strong>{metrics.plans}</strong><span>Active Plans</span></div>
        </div>
        <p className="hero-statement">Powered by Data <b>|</b> Driven by Efficiency <b>|</b> Built for a Sustainable Tomorrow</p>
      </div>

      <div className="login-panel login-panel--form">
        <div className="auth-corner-label">RAIL <b>×</b> LOGISTICS <b>×</b> INTELLIGENCE</div>
        <div className="auth-card auth-card--login">
          <div className="auth-card__heading">
            <div className="badge-pill"><ShieldCheck size={13} /> Secure access</div>
            <h1>Welcome back</h1>
            <p>Sign in to the decision support system.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              <span>Sign in as</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option>Operations Analyst</option>
                <option>Logistics Manager</option>
                <option>Planner</option>
                <option>Approver</option>
                <option>Operations Manager</option>
              </select>
            </label>

            <label>
              <span>Email / Username</span>
              <div className="input-with-icon">
                <Mail size={17} />
                <input
                  type="text"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="ops.manager@rakeformation.com"
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="password-field">
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter your password"
                />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <div className="auth-row">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="link-button" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Sign in
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-note" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button type="button" className="link-button" onClick={() => navigate('/register')}>
              Don&apos;t have an account? Create account
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
