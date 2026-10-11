import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { apiRequest } from '../api';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { notify } from '../utils/toast';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const search = searchParams.get('search') || '';
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    let active = true;
    apiRequest('/orders/')
      .then((data) => {
        if (active) {
          setOrders(Array.isArray(data) ? data : []);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load orders.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function updateSearch(value) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set('search', value);
      else next.delete('search');
      return next;
    }, { replace: true });
  }

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
    setSaving(true);
    setError('');
    try {
      await apiRequest(
        editingOrder ? `/orders/${editingOrder.order_id}` : '/orders/',
        {
          method: editingOrder ? 'PATCH' : 'POST',
        body: {
          ...form,
          quantity: Number(form.quantity),
        },
        },
      );
      setShowModal(false);
      setEditingOrder(null);
      setForm(emptyOrderForm);
      await loadOrders();
      notify({
        type: 'success',
        message: editingOrder ? 'Order updated successfully.' : 'Order created successfully.',
      });
    } catch (err) {
      setError(err.message || 'Unable to create order.');
      notify({ type: 'error', message: err.message || 'Unable to save order.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    const orderId = deletingOrder.order_id;
    setDeleting(true);
    setError('');
    try {
      await apiRequest(`/orders/${orderId}`, { method: 'DELETE' });
      await loadOrders();
      setDeletingOrder(null);
      notify({ type: 'success', message: 'Order deleted successfully.' });
    } catch (err) {
      setError(err.message || 'Unable to delete order.');
      notify({ type: 'error', message: err.message || 'Unable to delete order.' });
    } finally {
      setDeleting(false);
    }
  };

  function openCreate() {
    setEditingOrder(null);
    setForm(emptyOrderForm);
    setShowModal(true);
  }

  function openEdit(order) {
    setEditingOrder(order);
    setForm({
      customer_name: order.customer_name,
      material_name: order.material_name,
      grade: order.grade,
      quantity: String(order.quantity),
      destination: order.destination,
      priority: order.priority,
      delivery_date: order.delivery_date,
      status: order.status,
    });
    setShowModal(true);
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Orders</h1>
          <p className="subtext">Manage shipments, priorities and delivery status.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          Create Order
        </button>
      </div>

      <div className="toolbar">
        <SearchBar value={search} onChange={updateSearch} placeholder="Search orders..." />
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
        <EmptyState title="No orders found." description="Create your first order to get started." actionLabel="Create Order" onAction={openCreate} />
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
                      <button type="button" className="icon-action" aria-label={`View order ${order.order_id}`} onClick={() => setViewingOrder(order)}><Eye size={16} /></button>
                      <button type="button" className="icon-action" aria-label={`Edit order ${order.order_id}`} onClick={() => openEdit(order)}><Pencil size={16} /></button>
                      <button type="button" className="icon-action danger" aria-label={`Delete order ${order.order_id}`} onClick={() => setDeletingOrder(order)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={showModal} title={editingOrder ? `Edit Order #${editingOrder.order_id}` : 'Create Order'} onClose={() => { if (!saving) setShowModal(false); }}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label><span>Customer</span><input required value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} /></label>
          <label><span>Material</span><input required value={form.material_name} onChange={(event) => setForm({ ...form, material_name: event.target.value })} /></label>
          <label><span>Grade</span><input required value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} /></label>
          <label><span>Quantity</span><input required type="number" min="1" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
          <label><span>Destination</span><input required value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} /></label>
          <label><span>Priority</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>High</option><option>Medium</option><option>Low</option></select></label>
          <label><span>Required Date</span><input required type="date" value={form.delivery_date} onChange={(event) => setForm({ ...form, delivery_date: event.target.value })} /></label>
          <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Pending</option><option>In Transit</option><option>Completed</option></select></label>
          <div className="modal-actions modal-actions--full">
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editingOrder ? 'Update Order' : 'Save Order'}</button>
          </div>
        </form>
      </Modal>
      <Modal open={Boolean(viewingOrder)} title={`Order #${viewingOrder?.order_id ?? ''}`} onClose={() => setViewingOrder(null)}>
        {viewingOrder ? (
          <dl className="order-details">
            <div><dt>Customer</dt><dd>{viewingOrder.customer_name}</dd></div>
            <div><dt>Material / grade</dt><dd>{viewingOrder.material_name} · {viewingOrder.grade}</dd></div>
            <div><dt>Quantity</dt><dd>{Number(viewingOrder.quantity).toLocaleString()}</dd></div>
            <div><dt>Destination</dt><dd>{viewingOrder.destination}</dd></div>
            <div><dt>Priority</dt><dd>{viewingOrder.priority}</dd></div>
            <div><dt>Required date</dt><dd>{viewingOrder.delivery_date}</dd></div>
            <div><dt>Status</dt><dd>{viewingOrder.status}</dd></div>
          </dl>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(deletingOrder)}
        title="Delete order?"
        message={`Are you sure you want to delete order #${deletingOrder?.order_id ?? ''}? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete Order'}
        disabled={deleting}
        onCancel={() => { if (!deleting) setDeletingOrder(null); }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default Orders;
