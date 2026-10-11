import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { notify } from '../utils/toast';

const emptyPlanForm = { plan_code: '', plan_name: '', objective: '', status: 'draft' };

function fetchPlanningData() {
  return Promise.all([
    apiRequest('/rake-plans/'),
    apiRequest('/orders/'),
    apiRequest('/wagons/'),
  ]).then(([planData, orderData, wagonData]) => ({
    plans: Array.isArray(planData) ? planData : [],
    orders: Array.isArray(orderData) ? orderData : [],
    wagons: Array.isArray(wagonData) ? wagonData : [],
  }));
}

function fetchPlanDetailData(planId) {
  return Promise.all([
    apiRequest(`/rake-plans/${planId}`),
    apiRequest(`/rake-plans/${planId}/kpis`),
  ]);
}

function RakePlans() {
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wagons, setWagons] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [planKpis, setPlanKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [mode, setMode] = useState('balanced');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [planningHorizon, setPlanningHorizon] = useState('7');
  const [approverId, setApproverId] = useState('');
  const [approvalOrderId, setApprovalOrderId] = useState('');
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [saving, setSaving] = useState(false);
  const detailRequestId = useRef(0);

  function applyPlanningData(data) {
    setPlans(data.plans);
    setOrders(data.orders);
    setWagons(data.wagons);
    return data.plans;
  }

  function showPlanDetailError(loadError) {
    setPlanDetails(null);
    setPlanKpis(null);
    setError(loadError.message || 'Unable to load rake plan details.');
  }

  async function loadPlanningData() {
    let activeDetailRequestId = ++detailRequestId.current;
    setLoading(true);
    setDetailLoading(false);
    setError('');
    setPlanDetails(null);
    setPlanKpis(null);
    try {
      const data = await fetchPlanningData();
      const nextPlans = applyPlanningData(data);
      const nextSelectedPlanId = nextPlans.some((plan) => plan.id === selectedPlanId)
        ? selectedPlanId
        : nextPlans[0]?.id ?? null;
      setSelectedPlanId(nextSelectedPlanId);
      if (nextSelectedPlanId) {
        activeDetailRequestId = ++detailRequestId.current;
        setDetailLoading(true);
        const [details, kpis] = await fetchPlanDetailData(nextSelectedPlanId);
        if (activeDetailRequestId === detailRequestId.current) {
          setPlanDetails(details);
          setPlanKpis(kpis);
        }
      } else {
        activeDetailRequestId = ++detailRequestId.current;
        setPlanDetails(null);
        setPlanKpis(null);
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load rake planning data.');
    } finally {
      setLoading(false);
      if (activeDetailRequestId === detailRequestId.current) setDetailLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchPlanningData()
      .then((data) => {
        if (!active) return undefined;
        const nextPlans = applyPlanningData(data);
        const initialPlanId = nextPlans[0]?.id ?? null;
        setSelectedPlanId(initialPlanId);
        if (!initialPlanId) return undefined;
        const requestId = ++detailRequestId.current;
        setDetailLoading(true);
        return fetchPlanDetailData(initialPlanId).then(([details, kpis]) => {
          if (active && requestId === detailRequestId.current) {
            setPlanDetails(details);
            setPlanKpis(kpis);
          }
        });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load rake planning data.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setDetailLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  function selectPlan(planId) {
    const requestId = ++detailRequestId.current;
    setSelectedPlanId(planId);
    setPlanDetails(null);
    setPlanKpis(null);
    setError('');
    setDetailLoading(true);
    fetchPlanDetailData(planId)
      .then(([details, kpis]) => {
        if (requestId === detailRequestId.current) {
          setPlanDetails(details);
          setPlanKpis(kpis);
        }
      })
      .catch((loadError) => {
        if (requestId === detailRequestId.current) showPlanDetailError(loadError);
      })
      .finally(() => {
        if (requestId === detailRequestId.current) setDetailLoading(false);
      });
  }

  const availableOrders = useMemo(
    () => orders.filter((order) => !['completed', 'cancelled', 'rejected'].includes(String(order.status || '').toLowerCase())),
    [orders],
  );
  const currentDemand = availableOrders.reduce((sum, order) => sum + Number(order.quantity || 0), 0);
  const assignmentRows = planDetails?.assignments || [];
  const planCapacity = assignmentRows.reduce((sum, row) => {
    const wagon = wagons.find((item) => item.id === row.wagon_id);
    return sum + Number(wagon?.max_capacity_tons || row.quantity_tons || 0);
  }, 0);
  const planQuantity = Number(planKpis?.total_quantity_tons ?? assignmentRows.reduce((sum, row) => sum + Number(row.quantity_tons || 0), 0));
  const planUtilization = Number(planKpis?.average_wagon_utilization_percent ?? (planCapacity ? (planQuantity / planCapacity) * 100 : 0));
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  function openGenerate(optimizationMode) {
    setMode(optimizationMode);
    setSelectedOrderIds(availableOrders.map((order) => order.order_id));
    setShowGenerate(true);
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const generated = await apiRequest('/rake-plans/generate', {
        method: 'POST',
        body: {
          order_ids: selectedOrderIds,
          planning_horizon_days: Number(planningHorizon),
          optimization_mode: mode,
        },
      });
      const nextPlans = await apiRequest('/rake-plans/');
      setPlans(Array.isArray(nextPlans) ? nextPlans : []);
      detailRequestId.current += 1;
      setSelectedPlanId(generated.id);
      setPlanDetails(generated);
      setPlanKpis(null);
      setDetailLoading(false);
      setShowGenerate(false);
      notify({ type: 'success', message: 'Rake plan generated successfully.' });
    } catch (generateError) {
      setError(generateError.message || 'Unable to generate a rake plan.');
      notify({ type: 'error', message: generateError.message || 'Unable to generate a rake plan.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePlan(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await apiRequest('/rake-plans/', {
        method: 'POST',
        body: planForm,
      });
      detailRequestId.current += 1;
      setPlans((current) => [created, ...current]);
      setSelectedPlanId(created.id);
      setPlanDetails({ ...created, assignments: [] });
      setPlanKpis(null);
      setDetailLoading(false);
      setPlanForm(emptyPlanForm);
      setShowCreate(false);
      notify({ type: 'success', message: 'Rake plan created successfully.' });
    } catch (createError) {
      setError(createError.message || 'Unable to create a rake plan.');
      notify({ type: 'error', message: createError.message || 'Unable to create a rake plan.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitApproval(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiRequest('/approvals/', {
        method: 'POST',
        body: {
          order_id: Number(approvalOrderId),
          approver_id: Number(approverId),
          decision: 'pending',
          comments: `Submitted for approval from rake plan ${selectedPlan?.plan_code || selectedPlan?.plan_name}.`,
        },
      });
      setShowApproval(false);
      setApproverId('');
      setApprovalOrderId('');
      notify({ type: 'success', message: 'Rake plan submitted for approval.' });
    } catch (approvalError) {
      setError(approvalError.message || 'Unable to submit this plan for approval.');
      notify({ type: 'error', message: approvalError.message || 'Unable to submit this plan for approval.' });
    } finally {
      setSaving(false);
    }
  }

  const planOrders = [...new Set(assignmentRows.map((assignment) => assignment.order_id))];

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Planning</p>
          <h1>Rake Planning</h1>
        </div>
        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={() => openGenerate('balanced')}>Generate Rake Plan</button>
          <button type="button" className="btn btn-ghost" onClick={() => openGenerate('cost')}>Optimize</button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!selectedPlan || !assignmentRows.length}
            onClick={() => {
              setApprovalOrderId(String(planOrders[0] || ''));
              setShowApproval(true);
            }}
          >
            Submit for Approval
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(true)}>Create Plan</button>
          <button type="button" className="btn btn-ghost" disabled={loading} onClick={loadPlanningData}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      <div className="summary-grid summary-grid--five">
        <div className="summary-card"><span>Available wagons</span><strong>{wagons.filter((wagon) => wagon.available).length.toLocaleString()}</strong></div>
        <div className="summary-card"><span>Required capacity</span><strong>{currentDemand.toLocaleString()} t</strong></div>
        <div className="summary-card"><span>Current demand</span><strong>{currentDemand.toLocaleString()} t</strong></div>
        <div className="summary-card"><span>Planned rakes</span><strong>{plans.length.toLocaleString()}</strong></div>
        <div className="summary-card"><span>Optimization status</span><strong>{planDetails ? 'Ready' : 'Awaiting plan'}</strong></div>
      </div>

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}
      {loading ? <LoadingState title="Loading rake plans" subtitle="Assessing wagon allocation and demand coverage." /> : null}

      {!loading && !plans.length ? (
        <EmptyState title="No rake plans yet." description="Select active orders and generate a plan using the backend optimization service." actionLabel="Generate Plan" onAction={() => openGenerate('balanced')} />
      ) : null}

      {!loading && plans.length ? (
        <div className="page-stack">
          <div className="toolbar">
            <label className="select-label">
              <span>Select plan</span>
              <select className="select-input" value={selectedPlanId ?? ''} onChange={(event) => selectPlan(Number(event.target.value))}>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.plan_code} — {plan.plan_name}</option>)}
              </select>
            </label>
          </div>
          {detailLoading ? <LoadingState title="Loading selected rake plan" subtitle="Getting assigned wagons, orders, and utilization." /> : null}
          {!detailLoading && planDetails ? (
            <div className="detail-card detail-card--wide">
              <div className="detail-card__top">
                <div>
                  <p className="eyebrow">Rake Plan · {planDetails.plan_code}</p>
                  <h3>{planDetails.plan_name}</h3>
                  <p className="subtext">{planDetails.objective}</p>
                </div>
                <StatusBadge label={planDetails.status || 'Draft'} tone={String(planDetails.status).toLowerCase() === 'draft' ? 'warning' : 'success'} />
              </div>
              <div className="rake-formation">
                {assignmentRows.length ? assignmentRows.map((assignment, index) => {
                  const wagon = wagons.find((item) => item.id === assignment.wagon_id);
                  return <span key={assignment.id ?? assignment.wagon_id} className="wagon-box">{wagon?.wagon_number || `W${index + 1}`}</span>;
                }) : <span className="empty-inline">This plan has no wagon assignments. Generate an optimized plan to allocate wagons.</span>}
              </div>
              <div className="stats-row">
                <div><span>Total Capacity</span><strong>{planCapacity.toLocaleString()} t</strong></div>
                <div><span>Used Capacity</span><strong>{planQuantity.toLocaleString()} t</strong></div>
                <div><span>Utilization</span><strong>{planUtilization.toFixed(1)}%</strong></div>
                <div><span>Orders Assigned</span><strong>{planOrders.length}</strong></div>
                <div><span>Estimated Cost</span><strong>{Number(planKpis?.total_estimated_cost ?? assignmentRows.reduce((sum, row) => sum + Number(row.estimated_cost || 0), 0)).toLocaleString()}</strong></div>
                <div><span>Route</span><strong>{assignmentRows.length ? `${assignmentRows[0].origin} → ${assignmentRows[0].destination}` : 'Not assigned'}</strong></div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <Modal open={showGenerate} title={mode === 'cost' ? 'Optimize Rake Formation' : 'Generate Rake Plan'} onClose={() => { if (!saving) setShowGenerate(false); }}>
        <form className="auth-form" onSubmit={handleGenerate}>
          <p className="subtext">The backend planner allocates available wagons to selected active orders and persists the resulting plan.</p>
          {!availableOrders.length ? (
            <div className="notice notice--warning">No active orders are available. <Link to="/orders">Create an order</Link> before generating a plan.</div>
          ) : (
            <fieldset className="order-selection">
              <legend>Orders to plan</legend>
              {availableOrders.map((order) => (
                <label key={order.order_id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.order_id)}
                    onChange={(event) => setSelectedOrderIds((current) => (
                      event.target.checked
                        ? [...current, order.order_id]
                        : current.filter((id) => id !== order.order_id)
                    ))}
                  />
                  <span>#{order.order_id} · {order.customer_name} · {order.quantity} t · due {order.delivery_date}</span>
                </label>
              ))}
            </fieldset>
          )}
          <label><span>Planning horizon (days)</span><input required type="number" min="1" max="365" value={planningHorizon} onChange={(event) => setPlanningHorizon(event.target.value)} /></label>
          {error ? <div className="notice notice--error" role="alert">{error}</div> : null}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setShowGenerate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !selectedOrderIds.length || !availableOrders.length}>
              {saving ? (mode === 'cost' ? 'Optimizing…' : 'Generating…') : (mode === 'cost' ? 'Optimize plan' : 'Generate plan')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showCreate} title="Create Rake Plan" onClose={() => { if (!saving) setShowCreate(false); }}>
        <form className="auth-form" onSubmit={handleCreatePlan}>
          <label><span>Plan code</span><input required value={planForm.plan_code} onChange={(event) => setPlanForm((current) => ({ ...current, plan_code: event.target.value }))} /></label>
          <label><span>Plan name</span><input required value={planForm.plan_name} onChange={(event) => setPlanForm((current) => ({ ...current, plan_name: event.target.value }))} /></label>
          <label><span>Objective</span><input required value={planForm.objective} onChange={(event) => setPlanForm((current) => ({ ...current, objective: event.target.value }))} /></label>
          {error ? <div className="notice notice--error" role="alert">{error}</div> : null}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Plan'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showApproval} title="Submit Rake Plan for Approval" onClose={() => { if (!saving) setShowApproval(false); }}>
        <form className="auth-form" onSubmit={handleSubmitApproval}>
          <label>
            <span>Order included in this plan</span>
            <select required value={approvalOrderId} onChange={(event) => setApprovalOrderId(event.target.value)}>
              {planOrders.map((orderId) => {
                const order = orders.find((item) => item.order_id === orderId);
                return <option key={orderId} value={orderId}>Order #{orderId}{order ? ` · ${order.customer_name}` : ''}</option>;
              })}
            </select>
          </label>
          <label><span>Approver user ID</span><input required type="number" min="1" step="1" value={approverId} onChange={(event) => setApproverId(event.target.value)} /></label>
          {error ? <div className="notice notice--error" role="alert">{error}</div> : null}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setShowApproval(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !planOrders.length}>{saving ? 'Submitting…' : 'Submit for Approval'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RakePlans;
