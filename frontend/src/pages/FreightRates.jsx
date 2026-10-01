import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';

function FreightRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRates() {
      try {
        const data = await apiRequest('/freight-rates/');
        setRates(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load freight rates.');
      } finally {
        setLoading(false);
      }
    }
    loadRates();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Freight Rates</h1>
        </div>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {loading ? <LoadingState title="Loading freight rates" subtitle="Reviewing cost structure and route availability." /> : null}

      {!loading && !rates.length ? (
        <EmptyState title="No freight rates found." description="No route pricing data is available right now." />
      ) : null}

      {!loading && rates.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Origin</th>
                <th>Destination</th>
                <th>Material</th>
                <th>Distance</th>
                <th>Rate</th>
                <th>Effective Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr key={rate.id}>
                  <td>{rate.origin || '—'}</td>
                  <td>{rate.destination || '—'}</td>
                  <td>{rate.route_code || '—'}</td>
                  <td>{'840 km'}</td>
                  <td>₹{Number(rate.rate_per_ton || 0).toLocaleString()}</td>
                  <td>{rate.effective_from ? new Date(rate.effective_from).toLocaleDateString() : '—'}</td>
                  <td><StatusBadge label="Active" tone="active" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default FreightRates;
