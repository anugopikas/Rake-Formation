import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

const initialRecommendations = [
  { id: 1, type: 'Demand', reason: 'Forecasted traffic spike in Q3', impact: '+8.4% throughput', priority: 'High', confidence: '92%', action: 'Increase stock allocation by 12%' },
  { id: 2, type: 'Inventory', reason: 'Two plants operating below reorder threshold', impact: 'Reduce shortage risk', priority: 'Critical', confidence: '89%', action: 'Rebalance stock between lines' },
  { id: 3, type: 'Rake Planning', reason: 'Night service can absorb 4 extra wagons', impact: 'Higher utilization', priority: 'Medium', confidence: '87%', action: 'Reschedule next rake' },
];

function Recommendations() {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const data = await apiRequest('/recommendations/', { method: 'POST', body: { order_id: 1 } });
        if (data) {
          setRecommendations([{
            id: data.order_id,
            type: 'Optimization',
            reason: data.reason || 'Operational recommendation from the planning engine',
            impact: `${Number(data.estimated_cost || 0).toLocaleString()} cost impact`,
            priority: 'High',
            confidence: '91%',
            action: 'Review allocation plan',
          }, ...initialRecommendations]);
        }
      } catch {
        setRecommendations(initialRecommendations);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Decision support</p>
          <h1>AI Recommendations</h1>
          <p className="subtext">Actionable insights derived from planning and operational data.</p>
        </div>
      </div>

      {loading ? <LoadingState title="Loading recommendations" subtitle="Assessing planning signals and demand data." /> : null}
      {!loading && !recommendations.length ? (
        <EmptyState title="No recommendations available." description="The planning engine has not generated any current suggestions." />
      ) : null}

      {!loading && recommendations.length ? (
        <div className="card-grid recommendation-grid">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="detail-card recommendation-card">
              <div className="detail-card__top">
                <div>
                  <p className="eyebrow">{recommendation.type}</p>
                  <h3>{recommendation.reason}</h3>
                </div>
                <StatusBadge label={recommendation.priority} tone={recommendation.priority === 'Critical' ? 'critical' : recommendation.priority === 'High' ? 'high' : 'warning'} />
              </div>
              <p className="recommendation-impact">Impact: {recommendation.impact}</p>
              <p className="recommendation-meta">Confidence: {recommendation.confidence}</p>
              <div className="recommendation-action">
                <span>Recommended action</span>
                <strong>{recommendation.action}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default Recommendations;
