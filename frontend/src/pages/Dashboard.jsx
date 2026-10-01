import { AlertTriangle, ArrowRightLeft, PackageCheck, TrendingUp, Warehouse, ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import DemandChart from '../components/dashboard/DemandChart';
import InventoryChart from '../components/dashboard/InventoryChart';
import KPICard from '../components/dashboard/KPICard';
import RakeUtilizationChart from '../components/dashboard/RakeUtilizationChart';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';

const defaultData = {
  orders: [],
  inventory: [],
  wagons: [],
  plants: [],
  plans: [],
  approvals: [],
};

function Dashboard() {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [orders, inventory, wagons, plants, plans, approvals] = await Promise.all([
          apiRequest('/orders/'),
          apiRequest('/inventory/'),
          apiRequest('/wagons/'),
          apiRequest('/plants/'),
          apiRequest('/rake-plans/'),
          apiRequest('/approvals/'),
        ]);

        if (!ignore) {
          setData({
            orders: Array.isArray(orders) ? orders : [],
            inventory: Array.isArray(inventory) ? inventory : [],
            wagons: Array.isArray(wagons) ? wagons : [],
            plants: Array.isArray(plants) ? plants : [],
            plans: Array.isArray(plans) ? plans : [],
            approvals: Array.isArray(approvals) ? approvals : [],
          });
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const summary = useMemo(() => {
    const totalOrders = data.orders.length;
    const activePlans = data.plans.filter((item) => String(item.status).toLowerCase() !== 'draft').length;
    const totalInventory = data.inventory.reduce((sum, item) => sum + Number(item.available_units || 0), 0);
    const pendingApprovals = data.approvals.filter((item) => ['pending', 'requested', ''].includes(String(item.decision || '').toLowerCase())).length;

    return {
      totalOrders,
      activePlans,
      totalInventory,
      pendingApprovals,
    };
  }, [data]);

  const forecastData = [];

  const inventoryData = [
    { name: 'Available items', value: data.inventory.filter((item) => Number(item.available_units) > 0).length },
    { name: 'Empty items', value: data.inventory.filter((item) => Number(item.available_units) <= 0).length },
  ];

  const utilizationData = ['draft', 'planned', 'in transit', 'completed'].map((status) => ({
    name: status.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    value: data.plans.filter((item) => String(item.status || '').toLowerCase() === status).length,
  }));

  const activityItems = [
    ...data.plans.slice(0, 2).map((plan) => ({ id: `plan-${plan.id}`, action: `Rake plan ${plan.plan_code || plan.plan_name || 'updated'}`, user: plan.objective || 'Planning desk', status: plan.status || 'Recorded', time: plan.created_at || 'Recent' })),
    ...data.orders.slice(0, 2).map((order) => ({ id: `order-${order.order_id}`, action: `Order for ${order.customer_name}`, user: order.destination, status: order.status || 'Recorded', time: order.delivery_date || 'Scheduled' })),
  ];

  const alerts = [
    ...(inventoryData[1].value ? [{ label: `${inventoryData[1].value} inventory items have no available units`, tone: 'warning' }] : []),
    ...(summary.pendingApprovals ? [{ label: `${summary.pendingApprovals} approvals awaiting decision`, tone: 'info' }] : []),
    ...(summary.activePlans ? [{ label: `${summary.activePlans} active rake plans in the network`, tone: 'success' }] : []),
  ];

  if (loading) {
    return <LoadingState title="Loading operations dashboard" subtitle="Gathering orders, inventory, wagons, and planning activity." />;
  }

  if (error) {
    return <EmptyState title="Unable to load dashboard" description={error} actionLabel="Retry" onAction={() => window.location.reload()} />;
  }

  return (
    <div className="page-stack">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Network overview</p>
          <h1>Operations Dashboard</h1>
          <p className="subtext">Monitor railway logistics, inventory and rake planning in real time.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard title="Total Orders" value={summary.totalOrders.toLocaleString()} change="↑ 12.4%" description="vs last month" icon={ClipboardList} tone="primary" />
        <KPICard title="Active Rake Plans" value={summary.activePlans.toLocaleString()} change="↑ 8.1%" description="current plan coverage" icon={ArrowRightLeft} tone="secondary" />
        <KPICard title="Inventory Available" value={summary.totalInventory.toLocaleString()} change="↑ 4.7%" description="units across plants" icon={Warehouse} tone="success" />
        <KPICard title="Pending Approvals" value={summary.pendingApprovals.toLocaleString()} change="↓ 2.2%" description="awaiting decision" icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid-two">
        <DemandChart data={forecastData} />
        <InventoryChart data={inventoryData} />
      </div>

      <div className="grid-two">
        <RakeUtilizationChart data={utilizationData} />
        <div className="panel-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Operations</p>
              <h3>Operational Alerts</h3>
            </div>
          </div>
          <div className="alert-list">
            {alerts.length ? alerts.map((alert) => (
              <div key={alert.label} className="alert-item">
                <span className={`alert-dot alert-dot--${alert.tone}`} />
                <span>{alert.label}</span>
                <StatusBadge label={alert.tone.toUpperCase()} tone={alert.tone} />
              </div>
            )) : <div className="empty-inline">No operational alerts from the connected resources.</div>}
          </div>
        </div>
      </div>

      <div className="grid-two">
        <div className="panel-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Performance</p>
              <h3>Order Trends</h3>
            </div>
          </div>
          <div className="order-trend-box">
            <div className="metric-block">
              <strong>{summary.totalOrders.toLocaleString()}</strong>
              <span>Orders processed</span>
            </div>
            <div className="metric-block">
              <strong>{data.orders.length ? `${Math.round((data.orders.filter((order) => String(order.status).toLowerCase() === 'completed').length / data.orders.length) * 100)}%` : 'N/A'}</strong>
              <span>Completed orders</span>
            </div>
            <div className="metric-block">
              <strong>{data.wagons.length ? data.wagons.filter((wagon) => wagon.available).length.toLocaleString() : 'N/A'}</strong>
              <span>Available wagons</span>
            </div>
          </div>
        </div>
        <ActivityTimeline items={activityItems} />
      </div>
    </div>
  );
}

export default Dashboard;
