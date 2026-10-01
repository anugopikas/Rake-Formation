import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

function RakePlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await apiRequest('/rake-plans/');
        setPlans(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load rake plans.');
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Planning</p>
          <h1>Rake Planning</h1>
        </div>
        <div className="button-row">
          <button type="button" className="btn btn-primary">Generate Rake Plan</button>
          <button type="button" className="btn btn-ghost">Optimize</button>
          <button type="button" className="btn btn-ghost">Submit for Approval</button>
        </div>
      </div>

      <div className="summary-grid summary-grid--five">
        <div className="summary-card"><span>Available wagons</span><strong>{42}</strong></div>
        <div className="summary-card"><span>Required capacity</span><strong>13,800 t</strong></div>
        <div className="summary-card"><span>Current demand</span><strong>8,950 t</strong></div>
        <div className="summary-card"><span>Planned rakes</span><strong>{plans.length || 4}</strong></div>
        <div className="summary-card"><span>Optimization status</span><strong>Stable</strong></div>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {loading ? <LoadingState title="Loading rake plans" subtitle="Assessing wagon allocation and demand coverage." /> : null}

      {!loading && !plans.length ? (
        <EmptyState title="No rake plans yet." description="Generate a new plan to optimize wagon formation." actionLabel="Generate Plan" onAction={() => {}} />
      ) : null}

      {!loading && plans.length ? (
        <div className="detail-card detail-card--wide">
          <div className="detail-card__top">
            <div>
              <p className="eyebrow">Rake Plan</p>
              <h3>{plans[0]?.plan_name || 'RAKE PLAN #RK-1024'}</h3>
            </div>
            <StatusBadge label={plans[0]?.status || 'Draft'} tone={plans[0]?.status === 'draft' ? 'warning' : 'success'} />
          </div>
          <div className="rake-formation">
            {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((wagon) => (
              <span key={wagon} className="wagon-box">{wagon}</span>
            ))}
          </div>
          <div className="stats-row">
            <div><span>Total Capacity</span><strong>12,500 t</strong></div>
            <div><span>Utilization</span><strong>76%</strong></div>
            <div><span>Origin</span><strong>Jodhpur</strong></div>
            <div><span>Destination</span><strong>Raipur</strong></div>
            <div><span>Material</span><strong>Steel</strong></div>
            <div><span>Status</span><strong>Planned</strong></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default RakePlans;
