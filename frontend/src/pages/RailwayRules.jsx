import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiRequest } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ResourceCreateModal from '../components/common/ResourceCreateModal';

function RailwayRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    async function loadRules() {
      try {
        const data = await apiRequest('/railway-rules/');
        setRules(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Unable to load railway rules.');
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, []);

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Railway</p>
          <h1>Railway Rules</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Create Rule</button>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}
      {loading ? <LoadingState title="Loading railway rules" subtitle="Checking current operational constraints." /> : null}

      {!loading && !rules.length ? (
        <EmptyState title="No rules configured." description="Create operational rules to govern rake decisions." actionLabel="Create Rule" onAction={() => setShowCreate(true)} />
      ) : null}

      {!loading && rules.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Rule Name</th>
                <th>Description</th>
                <th>Constraint</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.rule_code}</td>
                  <td>{rule.rule_code}</td>
                  <td>{rule.description}</td>
                  <td>{rule.priority}</td>
                  <td><StatusBadge label={rule.active ? 'Active' : 'Inactive'} tone={rule.active ? 'active' : 'inactive'} /></td>
                  <td>Today</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <ResourceCreateModal
        open={showCreate}
        title="Create Railway Rule"
        endpoint="/railway-rules/"
        successMessage="Railway rule created successfully."
        onClose={() => setShowCreate(false)}
        onCreated={(rule) => setRules((current) => [...current, rule])}
        fields={[
          { name: 'rule_code', label: 'Rule code' },
          { name: 'description', label: 'Description' },
          { name: 'priority', label: 'Constraint priority', type: 'number', min: 1, step: 1, defaultValue: 1 },
          { name: 'active', label: 'Status', type: 'boolean', defaultValue: 'true', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
        ]}
      />
    </div>
  );
}

export default RailwayRules;
