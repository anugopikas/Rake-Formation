import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';

function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApprovals() {
      try {
        const data = await apiRequest('/approvals/');
        setApprovals(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load approvals.');
      } finally {
        setLoading(false);
      }
    }
    loadApprovals();
  }, []);

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
        <button type="button" className="tab-button active">Pending</button>
        <button type="button" className="tab-button">Approved</button>
        <button type="button" className="tab-button">Rejected</button>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {loading ? <LoadingState title="Loading approvals" subtitle="Checking pending review queues." /> : null}

      {!loading && !approvals.length ? (
        <EmptyState title="No approvals pending." description="There are no approval requests in the queue at the moment." />
      ) : null}

      {!loading && approvals.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Type</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((item) => (
                <tr key={item.id}>
                  <td>REQ-{item.id}</td>
                  <td>Rake Plan</td>
                  <td>Operations Lead</td>
                  <td>Today</td>
                  <td>High</td>
                  <td><StatusBadge label="Pending" tone="pending" /></td>
                  <td><button type="button" className="btn btn-ghost btn-small">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default Approvals;
