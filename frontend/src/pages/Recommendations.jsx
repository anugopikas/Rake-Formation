import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import { notify } from '../utils/toast';

function Recommendations() {
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await apiRequest('/orders/');
        const availableOrders = Array.isArray(data) ? data : [];
        setOrders(availableOrders);
        setOrderId((current) => current || String(availableOrders[0]?.order_id || ''));
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load orders for recommendations.');
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  async function generateRecommendation(event) {
    event.preventDefault();
    if (!orderId) {
      setError('Select an order before generating a recommendation.');
      return;
    }
    setGenerating(true);
    setError('');
    setRecommendation(null);
    try {
      const result = await apiRequest('/recommendations/', {
        method: 'POST',
        body: { order_id: Number(orderId) },
      });
      setRecommendation(result);
      notify({ type: 'success', message: 'Recommendation generated successfully.' });
    } catch (err) {
      setError(err.message || 'Unable to generate a recommendation.');
      notify({ type: 'error', message: err.message || 'Unable to generate a recommendation.' });
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <LoadingState title="Loading orders" subtitle="Preparing recommendation options." />;

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Decision Support</p>
          <h1>Rake Recommendations</h1>
          <p className="subtext">Generate a backend-validated formation recommendation for an order.</p>
        </div>
      </div>

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      {!orders.length ? (
        <EmptyState title="No orders available" description="Create an order before requesting a rake recommendation." />
      ) : (
        <form className="panel-card form-grid" onSubmit={generateRecommendation}>
          <label className="field">
            <span>Order</span>
            <select value={orderId} onChange={(event) => setOrderId(event.target.value)} required>
              {orders.map((order) => (
                <option key={order.order_id} value={order.order_id}>
                  #{order.order_id} · {order.customer_name} · {order.material_name} · {Number(order.quantity).toLocaleString()} tons
                </option>
              ))}
            </select>
          </label>
          <div className="field field--actions">
            <span aria-hidden="true">&nbsp;</span>
            <button className="btn btn-primary" type="submit" disabled={generating || !orderId}>
              {generating ? 'Generating…' : 'Generate recommendation'}
            </button>
          </div>
        </form>
      )}

      {generating ? <LoadingState title="Optimizing formation" subtitle="Checking capacity, routes, and freight rates." /> : null}

      {recommendation ? (
        <section className="panel-card page-stack" aria-live="polite">
          <div>
            <p className="eyebrow">Backend recommendation</p>
            <h2>Order #{recommendation.order_id}</h2>
          </div>
          <div className="stats-row">
            <div><span>Plant</span><strong>{recommendation.recommended_plant || '—'}</strong></div>
            <div><span>Route</span><strong>{[recommendation.origin, recommendation.destination].filter(Boolean).join(' → ') || '—'}</strong></div>
            <div><span>Quantity</span><strong>{recommendation.quantity != null ? `${Number(recommendation.quantity).toLocaleString()} tons` : '—'}</strong></div>
            <div><span>Wagons required</span><strong>{recommendation.allocated_wagons ?? '—'}</strong></div>
            <div><span>Estimated cost</span><strong>{recommendation.estimated_cost != null ? Number(recommendation.estimated_cost).toLocaleString(undefined, { style: 'currency', currency: 'INR' }) : '—'}</strong></div>
            <div><span>Estimated time</span><strong>{recommendation.estimated_time || '—'}</strong></div>
          </div>
          <p><strong>Decision:</strong> {recommendation.decision || '—'}</p>
          {recommendation.reason ? <p>{recommendation.reason}</p> : null}
          {Array.isArray(recommendation.warnings) && recommendation.warnings.length ? (
            <div className="notice notice--warning">{recommendation.warnings.join(' ')}</div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export default Recommendations;
