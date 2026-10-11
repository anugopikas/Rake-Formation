import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ResourceCreateModal from '../components/common/ResourceCreateModal';

function Plants() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    async function loadPlants() {
      try {
        const data = await apiRequest('/plants/');
        setPlants(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load plants.');
      } finally {
        setLoading(false);
      }
    }
    loadPlants();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Plants</h1>
          <p className="subtext">Overview of plant production capacity and operating status.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>Add Plant</button>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {loading ? <LoadingState title="Loading plants" subtitle="Connecting to plant capacity records." /> : null}

      {!loading && !plants.length ? (
        <EmptyState title="No plants available." description="There are no plants configured in the system yet." />
      ) : null}

      {!loading && plants.length ? (
        <div className="card-grid plant-grid">
          {plants.map((plant) => (
            <div key={plant.id} className="detail-card">
              <div className="detail-card__top">
                <div>
                  <p className="eyebrow">Plant</p>
                  <h3>{plant.plant_name}</h3>
                </div>
                <StatusBadge label={plant.active ? 'Active' : 'Inactive'} tone={plant.active ? 'active' : 'inactive'} />
              </div>
              <ul className="info-list">
                <li><span>Location</span><strong>{plant.region}</strong></li>
                <li><span>Capacity</span><strong>{plant.capacity_tons} tons</strong></li>
                <li><span>Code</span><strong>{plant.plant_code}</strong></li>
              </ul>
            </div>
          ))}
        </div>
      ) : null}
      <ResourceCreateModal
        open={showCreate}
        title="Add Plant"
        endpoint="/plants/"
        successMessage="Plant created successfully."
        onClose={() => setShowCreate(false)}
        onCreated={(plant) => setPlants((current) => [...current, plant])}
        fields={[
          { name: 'plant_code', label: 'Plant code' },
          { name: 'plant_name', label: 'Plant name' },
          { name: 'region', label: 'Region' },
          { name: 'capacity_tons', label: 'Capacity (tons)', type: 'number', min: 0.01 },
          { name: 'active', label: 'Status', type: 'boolean', defaultValue: 'true', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
        ]}
      />
    </div>
  );
}

export default Plants;
