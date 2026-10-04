import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiRequest } from '../api';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

const emptyItem = {
  item_code: '',
  item_name: '',
  category: '',
  available_units: '',
  location: '',
};

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyItem);
  const [saving, setSaving] = useState(false);

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
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Add Inventory</button>
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
        <EmptyState title="No inventory found." description="Create inventory records to track available quantities." actionLabel="Add Inventory" onAction={() => setShowCreate(true)} />
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
                <tr key={item.id ?? `${item.item_code}-${index}`}>
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

      <Modal open={showCreate} title="Add inventory item" onClose={() => { if (!saving) setShowCreate(false); }}>
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setSaving(true);
            setError('');
            try {
              const created = await apiRequest('/inventory/', {
                method: 'POST',
                body: { ...draft, available_units: Number(draft.available_units) },
              });
              setItems((current) => [...current, created]);
              setDraft(emptyItem);
              setShowCreate(false);
            } catch (err) {
              setError(err.message || 'Unable to add inventory.');
            } finally {
              setSaving(false);
            }
          }}
        >
          <label><span>Item code</span><input required value={draft.item_code} onChange={(event) => setDraft((current) => ({ ...current, item_code: event.target.value }))} /></label>
          <label><span>Material name</span><input required value={draft.item_name} onChange={(event) => setDraft((current) => ({ ...current, item_name: event.target.value }))} /></label>
          <label><span>Category</span><input required value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} /></label>
          <label><span>Available quantity</span><input required type="number" min="0" step="1" value={draft.available_units} onChange={(event) => setDraft((current) => ({ ...current, available_units: event.target.value }))} /></label>
          <label><span>Plant / location</span><input required value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} /></label>
          {error ? <div className="notice notice--error">{error}</div> : null}
          <div className="button-row">
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save inventory'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Inventory;
