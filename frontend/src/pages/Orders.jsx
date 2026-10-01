import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { apiRequest } from '../api';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

const emptyOrderForm = {
  customer_name: '',
  material_name: '',
  grade: '',
  quantity: '',
  destination: '',
  priority: 'High',
  delivery_date: '',
  status: 'Pending',
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyOrderForm);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await apiRequest('/orders/');
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = [order.customer_name, order.material_name, order.status, String(order.order_id)]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || order.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await apiRequest('/orders/', {
        method: 'POST',
        body: {
          ...form,
          quantity: Number(form.quantity),
        },
      });
      setShowModal(false);
      setForm(emptyOrderForm);
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Unable to create order.');
    }
  };

  const handleDelete = async (orderId) => {
    const ok = window.confirm('Remove this order?');
    if (!ok) return;

    try {
      await apiRequest(`/orders/${orderId}`, { method: 'DELETE' });
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Unable to delete order.');
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Orders</h1>
          <p className="subtext">Manage shipments, priorities and delivery status.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Create Order
        </button>
      </div>

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search orders..." />
        <select className="select-input" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Transit">In Transit</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      {loading ? <LoadingState title="Loading orders" subtitle="Gathering current shipment records." /> : null}

      {!loading && !filteredOrders.length ? (
        <EmptyState title="No orders found." description="Create your first order to get started." actionLabel="Create Order" onAction={() => setShowModal(true)} />
      ) : null}

      {!loading && filteredOrders.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Plant</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Priority</th>
                <th>Required Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.order_id}>
                  <td>#{order.order_id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.destination || '—'}</td>
                  <td>{order.material_name}</td>
                  <td>{order.quantity}</td>
                  <td>{order.priority}</td>
                  <td>{order.delivery_date}</td>
                  <td><StatusBadge label={order.status} tone={order.status === 'Completed' ? 'active' : order.status === 'Pending' ? 'pending' : 'info'} /></td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-action" aria-label="View order"><Eye size={16} /></button>
                      <button type="button" className="icon-action" aria-label="Edit order"><Pencil size={16} /></button>
                      <button type="button" className="icon-action danger" aria-label="Delete order" onClick={() => handleDelete(order.order_id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={showModal} title="Create Order" onClose={() => setShowModal(false)}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label><span>Customer</span><input value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} /></label>
          <label><span>Material</span><input value={form.material_name} onChange={(event) => setForm({ ...form, material_name: event.target.value })} /></label>
          <label><span>Grade</span><input value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} /></label>
          <label><span>Quantity</span><input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
          <label><span>Destination</span><input value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} /></label>
          <label><span>Priority</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>High</option><option>Medium</option><option>Low</option></select></label>
          <label><span>Required Date</span><input type="date" value={form.delivery_date} onChange={(event) => setForm({ ...form, delivery_date: event.target.value })} /></label>
          <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Pending</option><option>In Transit</option><option>Completed</option></select></label>
          <div className="modal-actions modal-actions--full">
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Order</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Orders;
