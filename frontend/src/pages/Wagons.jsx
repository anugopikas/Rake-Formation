import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

function Wagons() {
  const [wagons, setWagons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadWagons() {
      try {
        const data = await apiRequest('/wagons/');
        setWagons(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load wagons.');
      } finally {
        setLoading(false);
      }
    }
    loadWagons();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Fleet</p>
          <h1>Wagon Fleet</h1>
          <p className="subtext">Monitor availability and allocation across the fleet.</p>
        </div>
      </div>

      <div className="summary-grid summary-grid--four">
        <div className="summary-card"><span>Total Wagons</span><strong>{wagons.length}</strong></div>
        <div className="summary-card"><span>Available</span><strong>{wagons.filter((item) => item.available).length}</strong></div>
        <div className="summary-card"><span>Allocated</span><strong>{wagons.filter((item) => !item.available).length}</strong></div>
        <div className="summary-card"><span>Maintenance</span><strong>{0}</strong></div>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {loading ? <LoadingState title="Loading fleet" subtitle="Reviewing wagon allocation and maintenance state." /> : null}

      {!loading && !wagons.length ? (
        <EmptyState title="No wagons in the fleet." description="Add wagons to begin operational planning." />
      ) : null}

      {!loading && wagons.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Wagon ID</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Current Location</th>
                <th>Status</th>
                <th>Assigned Rake</th>
              </tr>
            </thead>
            <tbody>
              {wagons.map((wagon) => (
                <tr key={wagon.id}>
                  <td>{wagon.wagon_number}</td>
                  <td>{wagon.wagon_type}</td>
                  <td>{wagon.max_capacity_tons} tons</td>
                  <td>Line Yard</td>
                  <td><StatusBadge label={wagon.available ? 'Available' : 'Allocated'} tone={wagon.available ? 'active' : 'warning'} /></td>
                  <td>{wagon.available ? 'Unassigned' : 'RK-1024'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default Wagons;
