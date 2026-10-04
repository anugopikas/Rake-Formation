import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [relatedOrder, setRelatedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadApprovals() {
      try {
        const data = await apiRequest('/approvals/');
        setApprovals(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load approvals.');
      } finally {
        setLoading(false);
      }
    }
    loadApprovals();
  }, []);

  async function openDetails(item) {
    setSelected(item);
    setRelatedOrder(null);
    setOrderLoading(true);
    try {
      setRelatedOrder(await apiRequest(`/orders/${item.order_id}`));
    } catch {
      // Keep the approval details available if its related order was removed.
    } finally {
      setOrderLoading(false);
    }
  }

  const visibleApprovals = useMemo(() => approvals.filter((item) => {
    const status = String(item.decision || 'pending').toLowerCase();
    return status === activeTab;
  }), [approvals, activeTab]);

  async function updateDecision(decision) {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const updated = await apiRequest(`/approvals/${selected.id}`, {
        method: 'PATCH',
        body: { decision },
      });
      setApprovals((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setActiveTab(decision);
    } catch (err) {
      setError(err.message || 'Unable to update this approval.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Management</p>
          <h1>Approvals</h1>
          <p className="subtext">Review planning and operational requests requiring decision authority.</p>
        </div>
      </div>

      <div className="tab-row">
        {['pending', 'approved', 'rejected'].map((status) => (
          <button key={status} type="button" onClick={() => setActiveTab(status)} className={`tab-button ${activeTab === status ? 'active' : ''}`}>
            {status[0].toUpperCase() + status.slice(1)} ({approvals.filter((item) => String(item.decision || 'pending').toLowerCase() === status).length})
          </button>
        ))}
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {loading ? <LoadingState title="Loading approvals" subtitle="Checking review queues." /> : null}

      {!loading && !visibleApprovals.length ? (
        <EmptyState title={`No ${activeTab} approvals.`} description={`There are no ${activeTab} approval requests at the moment.`} />
      ) : null}

      {!loading && visibleApprovals.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Type</th>
                <th>Approver</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleApprovals.map((item) => (
                <tr key={item.id}>
                  <td>REQ-{item.id}</td>
                  <td>Order #{item.order_id}</td>
                  <td>User #{item.approver_id}</td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                  <td><StatusBadge label={item.decision || 'Pending'} tone={String(item.decision || 'pending').toLowerCase()} /></td>
                  <td><button type="button" className="btn btn-ghost btn-small" onClick={() => openDetails(item)}>View details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={Boolean(selected)} title={`Approval request REQ-${selected?.id ?? ''}`} onClose={() => { setSelected(null); setRelatedOrder(null); }}>
        {selected ? (
          <div className="page-stack">
            <div className="stats-row">
              <div><span>Request ID</span><strong>REQ-{selected.id}</strong></div>
              <div><span>Related order</span><strong>#{selected.order_id}</strong></div>
              <div><span>Approver</span><strong>User #{selected.approver_id}</strong></div>
              <div><span>Submitted</span><strong>{selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</strong></div>
              <div><span>Status</span><strong>{selected.decision || 'Pending'}</strong></div>
            </div>
            {orderLoading ? <LoadingState title="Loading related order" subtitle="Getting the order linked to this approval." /> : null}
            {relatedOrder ? (
              <div className="panel-card">
                <p className="eyebrow">Related order details</p>
                <div className="stats-row">
                  <div><span>Customer</span><strong>{relatedOrder.customer_name}</strong></div>
                  <div><span>Material</span><strong>{relatedOrder.material_name} · {relatedOrder.grade}</strong></div>
                  <div><span>Quantity</span><strong>{Number(relatedOrder.quantity).toLocaleString()}</strong></div>
                  <div><span>Destination</span><strong>{relatedOrder.destination}</strong></div>
                  <div><span>Delivery date</span><strong>{relatedOrder.delivery_date}</strong></div>
                  <div><span>Priority</span><strong>{relatedOrder.priority}</strong></div>
                </div>
              </div>
            ) : null}
            <div className="panel-card"><p className="eyebrow">Request comments</p><p>{selected.comments || 'No comments were added to this request.'}</p></div>
            {String(selected.decision || 'pending').toLowerCase() === 'pending' ? (
              <div className="button-row">
                <button type="button" className="btn btn-primary" disabled={saving} onClick={() => updateDecision('approved')}>{saving ? 'Saving…' : 'Approve'}</button>
                <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => updateDecision('rejected')}>Reject</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default Approvals;
