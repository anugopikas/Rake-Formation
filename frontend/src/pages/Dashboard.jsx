import { AlertTriangle, ArrowRightLeft, Warehouse, ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import DemandChart from '../components/dashboard/DemandChart';
import InventoryChart from '../components/dashboard/InventoryChart';
import OperationalAlerts from '../components/dashboard/OperationalAlerts';
import KPICard from '../components/dashboard/KPICard';
import RakeUtilizationChart from '../components/dashboard/RakeUtilizationChart';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

const defaultData = {
  orders: [],
  inventory: [],
  wagons: [],
  plants: [],
  plans: [],
  approvals: [],
};

const demoDemandValues = [820, 910, 980, 1080, 1160, 1240, 1320];

function formatForecastDate(value) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: '2-digit' }).format(parsedDate);
}

function mapForecastResponse(payload) {
  const rows = Array.isArray(payload) ? payload : payload?.forecast;
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row) => {
    const date = row.date ?? row.month;
    if (!date) return [];
    const actualValue = row.actual ?? row.demand ?? row.historical;
    const forecastValue = row.predicted ?? row.forecast;
    const actual = actualValue == null ? null : Number(actualValue);
    const forecast = forecastValue == null ? null : Number(forecastValue);
    if ((actual == null || !Number.isFinite(actual)) && (forecast == null || !Number.isFinite(forecast))) {
      return [];
    }
    return [{
      date: formatForecastDate(date),
      actual: actual != null && Number.isFinite(actual) ? actual : null,
      forecast: forecast != null && Number.isFinite(forecast) ? forecast : null,
    }];
  });
}

function buildFallbackForecast(orders) {
  const demandByDate = new Map();
  orders.forEach((order) => {
    const quantity = Number(order.quantity);
    if (!order.delivery_date || !Number.isFinite(quantity) || quantity <= 0) return;
    demandByDate.set(order.delivery_date, (demandByDate.get(order.delivery_date) || 0) + quantity);
  });

  if (demandByDate.size) {
    return [...demandByDate.entries()]
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, actual]) => ({
        date: formatForecastDate(date),
        actual,
        forecast: Math.round(actual * 1.1),
      }));
  }

  const startDate = new Date();
  return demoDemandValues.map((actual, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index * 5);
    return {
      date: formatForecastDate(date),
      actual,
      forecast: Math.round(actual * 1.1),
    };
  });
}

function buildFallbackAlerts(data) {
  const alerts = [];
  data.inventory.forEach((item) => {
    const available = Number(item.available_units || 0);
    if (available >= 250) return;
    alerts.push({
      id: `inventory-${item.id}`,
      severity: available < 100 ? 'CRITICAL' : 'HIGH',
      title: 'Low inventory detected',
      message: `${item.item_name} is below the 250-unit review threshold (${available} available).`,
      time: 'Current',
      action_label: 'View Inventory',
      action_url: '/inventory',
    });
  });

  data.orders
    .filter((order) => !['completed', 'cancelled', 'rejected'].includes(String(order.status || '').toLowerCase()))
    .slice(0, 2)
    .forEach((order) => {
      alerts.push({
        id: `order-${order.order_id}`,
        severity: String(order.priority || '').toLowerCase() === 'high' ? 'HIGH' : 'WARNING',
        title: 'Order fulfillment risk',
        message: `Order for ${order.customer_name} to ${order.destination} is awaiting fulfillment.`,
        time: `Due ${order.delivery_date || 'date not set'}`,
        action_label: 'View Order',
        action_url: '/orders',
      });
    });

  const pendingApprovals = data.approvals.filter((item) =>
    ['pending', 'requested', ''].includes(String(item.decision || '').toLowerCase()),
  );
  if (pendingApprovals.length) {
    alerts.push({
      id: 'pending-approvals',
      severity: 'INFO',
      title: 'Approvals awaiting review',
      message: `${pendingApprovals.length} operational approval(s) need a decision.`,
      time: 'Awaiting review',
      action_label: 'View Approvals',
      action_url: '/approvals',
    });
  }

  if (alerts.length) return alerts.slice(0, 6);
  return [
    {
      id: 'demo-inventory',
      severity: 'HIGH',
      title: 'Low inventory detected',
      message: 'Steel Coil inventory is below the recommended threshold.',
      time: '10 minutes ago',
      action_label: 'View Inventory',
      action_url: '/inventory',
    },
    {
      id: 'demo-rake-capacity',
      severity: 'WARNING',
      title: 'Rake capacity nearing limit',
      message: 'Rake RP001 is currently at 92% capacity.',
      time: '25 minutes ago',
      action_label: 'View Rake',
      action_url: '/rake-plans',
    },
    {
      id: 'demo-order-risk',
      severity: 'CRITICAL',
      title: 'Order fulfillment risk',
      message: 'An order may miss its planned dispatch window.',
      time: '42 minutes ago',
      action_label: 'View Order',
      action_url: '/orders',
    },
    {
      id: 'demo-recommendation',
      severity: 'INFO',
      title: 'New rake recommendation available',
      message: 'The AI optimizer has a new formation recommendation to review.',
      time: '1 hour ago',
      action_label: 'View Rake Plans',
      action_url: '/rake-plans',
    },
  ];
}

function Dashboard() {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forecastState, setForecastState] = useState({ data: [], loading: true, error: '' });
  const [alertsState, setAlertsState] = useState({ data: [], loading: true, error: '' });

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

    async function loadForecast() {
      try {
        const response = await apiRequest('/forecast/demand');
        if (!ignore) {
          setForecastState({ data: mapForecastResponse(response), loading: false, error: '' });
        }
      } catch (err) {
        if (!ignore) {
          setForecastState({ data: [], loading: false, error: err.message || 'Unable to load forecast.' });
        }
      }
    }

    async function loadAlerts() {
      try {
        const response = await apiRequest('/alerts/');
        const alerts = Array.isArray(response) ? response : response?.alerts;
        if (!ignore) {
          setAlertsState({
            data: Array.isArray(alerts) ? alerts.map((alert, index) => ({
              ...alert,
              id: alert.id ?? `${alert.title}-${index}`,
            })) : [],
            loading: false,
            error: '',
          });
        }
      } catch (err) {
        if (!ignore) {
          setAlertsState({ data: [], loading: false, error: err.message || 'Unable to load alerts.' });
        }
      }
    }

    loadDashboard();
    loadForecast();
    loadAlerts();
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

  const usingForecastFallback = !forecastState.data.length;
  const forecastData = usingForecastFallback
    ? buildFallbackForecast(data.orders)
    : forecastState.data;
  const usingAlertFallback = !alertsState.data.length;
  const alerts = usingAlertFallback ? buildFallbackAlerts(data) : alertsState.data;
  const hasOrderHistory = data.orders.some((order) =>
    order.delivery_date && Number(order.quantity) > 0,
  );
  const usingDemoAlerts = alerts.some((alert) => String(alert.id).startsWith('demo-'));

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
        <DemandChart
          data={forecastData}
          loading={forecastState.loading}
          notice={usingForecastFallback
            ? (forecastState.error
              ? 'Showing latest available forecast data. Projection is based on recorded order demand.'
              : hasOrderHistory
                ? 'Forecast projected from connected order demand because the API returned no points.'
                : 'Demo forecast shown because no order history is available.')
            : ''}
        />
        <InventoryChart data={inventoryData} />
      </div>

      <div className="grid-two">
        <RakeUtilizationChart data={utilizationData} />
        <OperationalAlerts
          alerts={alerts}
          loading={alertsState.loading}
          notice={usingAlertFallback
            ? (alertsState.error
              ? usingDemoAlerts
                ? 'Showing latest available operational alerts. Sample alerts are shown until the API responds.'
                : 'Showing latest available operational alerts based on connected resources.'
              : usingDemoAlerts
                ? 'Sample alerts are shown because there are no active API alerts.'
                : 'Alerts are derived from connected operational resources.')
            : ''}
        />
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
