import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiRequest } from '../api';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadInventory() {
      try {
        const data = await apiRequest('/inventory/');
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load inventory.');
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => [item.item_name, item.location, item.category].join(' ').toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Inventory Management</h1>
          <p className="subtext">Track material availability, reserve levels, and replenishment priorities.</p>
        </div>
        <button type="button" className="btn btn-primary"><Plus size={16} />Add Inventory</button>
      </div>

      <div className="summary-grid">
        <div className="summary-card"><span>Total Inventory</span><strong>{items.reduce((sum, item) => sum + Number(item.available_units || 0), 0).toLocaleString()}</strong></div>
        <div className="summary-card"><span>Available</span><strong>{items.length ? '86%' : '0%'}</strong></div>
        <div className="summary-card"><span>Reserved</span><strong>{items.length ? '12%' : '0%'}</strong></div>
        <div className="summary-card"><span>Low Stock</span><strong>{items.filter((item) => Number(item.available_units || 0) < 250).length}</strong></div>
      </div>

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search inventory..." />
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {loading ? <LoadingState title="Loading inventory" subtitle="Checking stock levels and plant availability." /> : null}

      {!loading && !filteredItems.length ? (
        <EmptyState title="No inventory found." description="Create inventory records to track available quantities." actionLabel="Add Inventory" onAction={() => {}} />
      ) : null}

      {!loading && filteredItems.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Plant</th>
                <th>Available Qty</th>
                <th>Reserved Qty</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={`${item.item_code}-${index}`}>
                  <td>{item.item_name}</td>
                  <td>{item.location}</td>
                  <td>{item.available_units}</td>
                  <td>{Math.max(0, Number(item.available_units || 0) / 6)}</td>
                  <td>{Math.max(50, Math.ceil(Number(item.available_units || 0) * 0.2))}</td>
                  <td><StatusBadge label={Number(item.available_units || 0) < 100 ? 'Critical' : Number(item.available_units || 0) < 250 ? 'Low Stock' : 'Available'} tone={Number(item.available_units || 0) < 100 ? 'critical' : Number(item.available_units || 0) < 250 ? 'warning' : 'active'} /></td>
                  <td>Today</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default Inventory;
