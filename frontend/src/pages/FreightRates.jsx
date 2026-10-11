import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiRequest } from '../api';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';
import ResourceCreateModal from '../components/common/ResourceCreateModal';

function FreightRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

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
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Add Freight Rate</button>
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
      <ResourceCreateModal
        open={showCreate}
        title="Add Freight Rate"
        endpoint="/freight-rates/"
        successMessage="Freight rate created successfully."
        onClose={() => setShowCreate(false)}
        onCreated={(rate) => setRates((current) => [...current, rate])}
        fields={[
          { name: 'route_code', label: 'Route code' },
          { name: 'origin', label: 'Origin' },
          { name: 'destination', label: 'Destination' },
          { name: 'rate_per_ton', label: 'Rate per ton', type: 'number', min: 0.01 },
          { name: 'effective_from', label: 'Effective from', type: 'datetime-local' },
        ]}
      />
    </div>
  );
}

export default FreightRates;
