import { useEffect, useMemo, useState } from "react";
import { apiRequest, getFriendlyErrorMessage } from "./api";
import PageShell from "./components/PageShell";
import "./App.css";

const DEFAULT_FORM = {
  order: {
    customer_name: "",
    material_name: "",
    grade: "",
    quantity: "",
    destination: "",
    priority: "High",
    delivery_date: "",
    status: "Pending",
  },
  plant: {
    plant_code: "",
    plant_name: "",
    region: "",
    capacity_tons: "",
    active: true,
  },
  wagon: {
    wagon_number: "",
    wagon_type: "",
    max_capacity_tons: "",
    available: true,
  },
  inventory: {
    item_code: "",
    item_name: "",
    category: "",
    available_units: "",
    location: "",
  },
  freightRate: {
    route_code: "",
    origin: "",
    destination: "",
    rate_per_ton: "",
    effective_from: "",
  },
  railwayRule: {
    rule_code: "",
    description: "",
    priority: 1,
    active: true,
  },
};

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [backendConnected, setBackendConnected] = useState(false);
  const [dashboard, setDashboard] = useState({ orders: [], wagons: [], plants: [], inventory: [] });
  const [orders, setOrders] = useState([]);
  const [plants, setPlants] = useState([]);
  const [wagons, setWagons] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [freightRates, setFreightRates] = useState([]);
  const [railwayRules, setRailwayRules] = useState([]);
  const [rakePlans, setRakePlans] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forms, setForms] = useState(DEFAULT_FORM);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const health = await apiRequest("/health");
      setBackendConnected(Boolean(health && health.status === "ok"));

      const [ordersData, plantsData, wagonsData, inventoryData, freightRatesData, railwayRulesData, rakePlansData] = await Promise.all([
        apiRequest("/orders/"),
        apiRequest("/plants/"),
        apiRequest("/wagons/"),
        apiRequest("/inventory/"),
        apiRequest("/freight-rates/"),
        apiRequest("/railway-rules/"),
        apiRequest("/rake-plans/"),
      ]);

      setDashboard({
        orders: Array.isArray(ordersData) ? ordersData : [],
        wagons: Array.isArray(wagonsData) ? wagonsData : [],
        plants: Array.isArray(plantsData) ? plantsData : [],
        inventory: Array.isArray(inventoryData) ? inventoryData : [],
      });
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setPlants(Array.isArray(plantsData) ? plantsData : []);
      setWagons(Array.isArray(wagonsData) ? wagonsData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setFreightRates(Array.isArray(freightRatesData) ? freightRatesData : []);
      setRailwayRules(Array.isArray(railwayRulesData) ? railwayRulesData : []);
      setRakePlans(Array.isArray(rakePlansData) ? rakePlansData : []);
    } catch (err) {
      setBackendConnected(false);
      setError(getFriendlyErrorMessage(err));
      setDashboard({ orders: [], wagons: [], plants: [], inventory: [] });
      setOrders([]);
      setPlants([]);
      setWagons([]);
      setInventory([]);
      setFreightRates([]);
      setRailwayRules([]);
      setRakePlans([]);
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll() {
    await loadDashboard();
  }

  async function createOrder(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...forms.order,
        quantity: Number(forms.order.quantity),
      };
      await apiRequest("/orders/", { method: "POST", body: payload });
      setSuccess("Order created successfully.");
      setForms((current) => ({ ...current, order: DEFAULT_FORM.order }));
      await refreshAll();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function createPlant(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...forms.plant,
        capacity_tons: Number(forms.plant.capacity_tons),
        active: Boolean(forms.plant.active),
      };
      await apiRequest("/plants/", { method: "POST", body: payload });
      setSuccess("Plant created successfully.");
      setForms((current) => ({ ...current, plant: DEFAULT_FORM.plant }));
      await refreshAll();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function createWagon(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...forms.wagon,
        max_capacity_tons: Number(forms.wagon.max_capacity_tons),
        available: Boolean(forms.wagon.available),
      };
      await apiRequest("/wagons/", { method: "POST", body: payload });
      setSuccess("Wagon created successfully.");
      setForms((current) => ({ ...current, wagon: DEFAULT_FORM.wagon }));
      await refreshAll();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function createInventory(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...forms.inventory,
        available_units: Number(forms.inventory.available_units),
      };
      await apiRequest("/inventory/", { method: "POST", body: payload });
      setSuccess("Inventory item created successfully.");
      setForms((current) => ({ ...current, inventory: DEFAULT_FORM.inventory }));
      await refreshAll();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function createFreightRate(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...forms.freightRate,
        rate_per_ton: Number(forms.freightRate.rate_per_ton),
      };
      await apiRequest("/freight-rates/", { method: "POST", body: payload });
      setSuccess("Freight rate created successfully.");
      setForms((current) => ({ ...current, freightRate: DEFAULT_FORM.freightRate }));
      await refreshAll();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function createRailwayRule(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...forms.railwayRule,
        priority: Number(forms.railwayRule.priority),
        active: Boolean(forms.railwayRule.active),
      };
      await apiRequest("/railway-rules/", { method: "POST", body: payload });
      setSuccess("Railway rule created successfully.");
      setForms((current) => ({ ...current, railwayRule: DEFAULT_FORM.railwayRule }));
      await refreshAll();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function generateRecommendation(orderId) {
    if (!orderId) {
      setError("Please select an order before generating a recommendation.");
      return;
    }

    setRecommendationLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiRequest("/recommendations/", { method: "POST", body: { order_id: Number(orderId) } });
      setSuccess("AI recommendation generated.");
      setRecommendations((current) => [response, ...current]);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setRecommendationLoading(false);
    }
  }

  function handleOrderSelection(event) {
    const orderId = event.target.value;
    setSelectedOrderId(orderId);
    const chosenOrder = orders.find((order) => String(order.order_id) === String(orderId)) || null;
    setSelectedOrder(chosenOrder);
  }

  const totalInventory = useMemo(() => dashboard.inventory.reduce((total, item) => total + Number(item.available_units || 0), 0), [dashboard.inventory]);
  const availableWagons = useMemo(() => dashboard.wagons.filter((wagon) => wagon.available).length, [dashboard.wagons]);
  const activePlants = useMemo(() => dashboard.plants.filter((plant) => plant.active).length, [dashboard.plants]);

  function renderDashboard() {
    return (
      <PageShell title="Dashboard" subtitle="Real-time railway operations overview" rightAction={<div className={`status-pill ${backendConnected ? "online" : "offline"}`}><span className="dot" />{backendConnected ? "Backend Connected" : "Backend Offline"}</div>}>
        {error ? <div className="error-box">⚠️ {error}</div> : null}
        {success ? <div className="success-box">✓ {success}</div> : null}

        {loading ? (
          <div className="loading">Loading dashboard data...</div>
        ) : (
          <>
            <section className="stats">
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon blue">📦</div>
                  <span className="stat-label">ORDERS</span>
                </div>
                <h2>{dashboard.orders.length}</h2>
                <p>Total orders</p>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon orange">🚂</div>
                  <span className="stat-label">WAGONS</span>
                </div>
                <h2>{availableWagons}</h2>
                <p>Available wagons</p>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green">🏭</div>
                  <span className="stat-label">PLANTS</span>
                </div>
                <h2>{activePlants}</h2>
                <p>Active plants</p>
              </div>
              <div className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple">📊</div>
                  <span className="stat-label">INVENTORY</span>
                </div>
                <h2>{totalInventory}</h2>
                <p>Available units</p>
              </div>
            </section>

            {recommendations.length > 0 ? (
              <section className="panel ai-summary-panel">
                <div className="panel-header">
                  <div>
                    <h2>AI Recommendation Snapshot</h2>
                    <p>Most recent recommendation generated from the live backend</p>
                  </div>
                  <button className="primary-button" onClick={() => setActiveView("recommendations")}>View Recommendation</button>
                </div>
                <div className="recommendation-summary">
                  <div className="summary-tile">
                    <small>Order</small>
                    <strong>#{recommendations[0].order_id}</strong>
                  </div>
                  <div className="summary-tile">
                    <small>Decision</small>
                    <strong><span className={`badge ${recommendations[0].decision === "APPROVED" ? "success" : recommendations[0].decision === "REVIEW REQUIRED" ? "warning" : "danger"}`}>{recommendations[0].decision}</span></strong>
                  </div>
                  <div className="summary-tile">
                    <small>Plant / Wagons</small>
                    <strong>{recommendations[0].recommended_plant || "-"} • {recommendations[0].recommended_wagons || recommendations[0].allocated_wagons || 0} wagons</strong>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Recent Orders</h2>
                  <p>Latest orders from the backend</p>
                </div>
                <button className="primary-button" onClick={() => setActiveView("orders")}>+ Create Order</button>
              </div>
              {dashboard.orders.length === 0 ? (
                <div className="empty-state">
                  <div>📦</div>
                  <h3>No orders found</h3>
                  <p>Create an order from the Orders view to populate this list.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>CUSTOMER</th>
                        <th>MATERIAL</th>
                        <th>QUANTITY</th>
                        <th>DESTINATION</th>
                        <th>PRIORITY</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.orders.map((order) => (
                        <tr key={order.order_id}>
                          <td><strong>#{order.order_id}</strong></td>
                          <td>{order.customer_name}</td>
                          <td>{order.material_name}</td>
                          <td>{order.quantity} tons</td>
                          <td>{order.destination}</td>
                          <td><span className={`priority ${String(order.priority || "").toLowerCase()}`}>{order.priority}</span></td>
                          <td><span className={`order-status ${String(order.status || "").toLowerCase()}`}>{order.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="overview-grid">
              <div className="small-panel">
                <div className="small-panel-header">
                  <h3>🏭 Plants</h3>
                  <span>{dashboard.plants.length} Total</span>
                </div>
                {dashboard.plants.length === 0 ? (
                  <p className="muted">No plants available.</p>
                ) : (
                  <div className="card-list">
                    {dashboard.plants.slice(0, 3).map((plant) => (
                      <div className="card-list-item" key={plant.id}>
                        <div>
                          <strong>{plant.plant_name}</strong>
                          <small>{plant.region}</small>
                        </div>
                        <span className="capacity">{plant.capacity_tons} T</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="small-panel">
                <div className="small-panel-header">
                  <h3>🚂 Wagons</h3>
                  <span>{dashboard.wagons.length} Total</span>
                </div>
                {dashboard.wagons.length === 0 ? (
                  <p className="muted">No wagons available.</p>
                ) : (
                  <div className="card-list">
                    {dashboard.wagons.slice(0, 3).map((wagon) => (
                      <div className="card-list-item" key={wagon.id}>
                        <div>
                          <strong>{wagon.wagon_number}</strong>
                          <small>{wagon.wagon_type}</small>
                        </div>
                        <span className={wagon.available ? "available" : "unavailable"}>{wagon.available ? "Available" : "Unavailable"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </PageShell>
    );
  }

  function renderOrders() {
    return (
      <PageShell title="Orders" subtitle="Manage shipment orders and create new requests" rightAction={<button className="primary-button" onClick={() => setActiveView("dashboard")}>← Back</button>}>
        {error ? <div className="error-box">⚠️ {error}</div> : null}
        {success ? <div className="success-box">✓ {success}</div> : null}
        <div className="form-grid">
          <form className="form-card" onSubmit={createOrder}>
            <h3>Create Order</h3>
            <div className="form-field"><label>Customer Name</label><input value={forms.order.customer_name} onChange={(event) => setForms((current) => ({ ...current, order: { ...current.order, customer_name: event.target.value } }))} required /></div>
            <div className="form-field"><label>Material</label><input value={forms.order.material_name} onChange={(event) => setForms((current) => ({ ...current, order: { ...current.order, material_name: event.target.value } }))} required /></div>
            <div className="form-field"><label>Grade</label><input value={forms.order.grade} onChange={(event) => setForms((current) => ({ ...current, order: { ...current.order, grade: event.target.value } }))} required /></div>
            <div className="form-field"><label>Quantity</label><input type="number" value={forms.order.quantity} onChange={(event) => setForms((current) => ({ ...current, order: { ...current.order, quantity: event.target.value } }))} required /></div>
            <div className="form-field"><label>Destination</label><input value={forms.order.destination} onChange={(event) => setForms((current) => ({ ...current, order: { ...current.order, destination: event.target.value } }))} required /></div>
            <div className="form-field"><label>Priority</label><select value={forms.order.priority} onChange={(event) => setForms((current) => ({ ...current, order: { ...current.order, priority: event.target.value } }))}><option>High</option><option>Medium</option><option>Low</option></select></div>
            <div className="form-field"><label>Delivery Date</label><input type="date" value={forms.order.delivery_date} onChange={(event) => setForms((current) => ({ ...current, order: { ...current.order, delivery_date: event.target.value } }))} required /></div>
            <div className="form-field"><label>Status</label><select value={forms.order.status} onChange={(event) => setForms((current) => ({ ...current, order: { ...current.order, status: event.target.value } }))}><option>Pending</option><option>Approved</option><option>Completed</option></select></div>
            <div className="form-actions"><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Creating..." : "+ Create Order"}</button></div>
          </form>

          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header">
              <div><h2>Order List</h2><p>Current orders from the backend</p></div>
            </div>
            {loading ? <div className="loading">Loading orders...</div> : orders.length === 0 ? <div className="empty-state"><div>📦</div><h3>No orders found</h3><p>There are no orders yet.</p></div> : <div className="table-container"><table><thead><tr><th>ID</th><th>CUSTOMER</th><th>MATERIAL</th><th>QUANTITY</th><th>PRIORITY</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{orders.map((order) => <tr key={order.order_id}><td><strong>#{order.order_id}</strong></td><td>{order.customer_name}</td><td>{order.material_name}</td><td>{order.quantity}</td><td><span className={`priority ${String(order.priority || "").toLowerCase()}`}>{order.priority}</span></td><td><span className={`order-status ${String(order.status || "").toLowerCase()}`}>{order.status}</span></td><td><button className="secondary-button" onClick={() => generateRecommendation(order.order_id)}>AI</button></td></tr>)}</tbody></table></div>}
          </div>
        </div>
      </PageShell>
    );
  }

  function renderPlants() {
    return (
      <PageShell title="Plants" subtitle="Manage operational plants and capacity" rightAction={<button className="primary-button" onClick={() => setActiveView("dashboard")}>← Back</button>}>
        {error ? <div className="error-box">⚠️ {error}</div> : null}
        {success ? <div className="success-box">✓ {success}</div> : null}
        <div className="form-grid">
          <form className="form-card" onSubmit={createPlant}>
            <h3>Create Plant</h3>
            <div className="form-field"><label>Plant Code</label><input value={forms.plant.plant_code} onChange={(event) => setForms((current) => ({ ...current, plant: { ...current.plant, plant_code: event.target.value } }))} required /></div>
            <div className="form-field"><label>Plant Name</label><input value={forms.plant.plant_name} onChange={(event) => setForms((current) => ({ ...current, plant: { ...current.plant, plant_name: event.target.value } }))} required /></div>
            <div className="form-field"><label>Region</label><input value={forms.plant.region} onChange={(event) => setForms((current) => ({ ...current, plant: { ...current.plant, region: event.target.value } }))} required /></div>
            <div className="form-field"><label>Capacity (tons)</label><input type="number" value={forms.plant.capacity_tons} onChange={(event) => setForms((current) => ({ ...current, plant: { ...current.plant, capacity_tons: event.target.value } }))} required /></div>
            <div className="form-field"><label>Active</label><select value={forms.plant.active ? "true" : "false"} onChange={(event) => setForms((current) => ({ ...current, plant: { ...current.plant, active: event.target.value === "true" } }))}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="form-actions"><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Plant"}</button></div>
          </form>
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header"><div><h2>Plant List</h2><p>Plants loaded from the backend</p></div></div>
            {loading ? <div className="loading">Loading plants...</div> : plants.length === 0 ? <div className="empty-state"><div>🏭</div><h3>No plants found</h3><p>Create a plant to get started.</p></div> : <div className="table-container"><table><thead><tr><th>CODE</th><th>NAME</th><th>REGION</th><th>CAPACITY</th><th>STATUS</th></tr></thead><tbody>{plants.map((plant) => <tr key={plant.id}><td>{plant.plant_code}</td><td>{plant.plant_name}</td><td>{plant.region}</td><td>{plant.capacity_tons}</td><td><span className={`badge ${plant.active ? "success" : "warning"}`}>{plant.active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div>}
          </div>
        </div>
      </PageShell>
    );
  }

  function renderWagons() {
    return (
      <PageShell title="Wagons" subtitle="Track wagon availability and capacity" rightAction={<button className="primary-button" onClick={() => setActiveView("dashboard")}>← Back</button>}>
        {error ? <div className="error-box">⚠️ {error}</div> : null}
        {success ? <div className="success-box">✓ {success}</div> : null}
        <div className="form-grid">
          <form className="form-card" onSubmit={createWagon}>
            <h3>Create Wagon</h3>
            <div className="form-field"><label>Wagon Number</label><input value={forms.wagon.wagon_number} onChange={(event) => setForms((current) => ({ ...current, wagon: { ...current.wagon, wagon_number: event.target.value } }))} required /></div>
            <div className="form-field"><label>Wagon Type</label><input value={forms.wagon.wagon_type} onChange={(event) => setForms((current) => ({ ...current, wagon: { ...current.wagon, wagon_type: event.target.value } }))} required /></div>
            <div className="form-field"><label>Maximum Capacity (tons)</label><input type="number" value={forms.wagon.max_capacity_tons} onChange={(event) => setForms((current) => ({ ...current, wagon: { ...current.wagon, max_capacity_tons: event.target.value } }))} required /></div>
            <div className="form-field"><label>Available</label><select value={forms.wagon.available ? "true" : "false"} onChange={(event) => setForms((current) => ({ ...current, wagon: { ...current.wagon, available: event.target.value === "true" } }))}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="form-actions"><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Wagon"}</button></div>
          </form>
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header"><div><h2>Wagon List</h2><p>Wagons coming from the backend</p></div></div>
            {loading ? <div className="loading">Loading wagons...</div> : wagons.length === 0 ? <div className="empty-state"><div>🚂</div><h3>No wagons found</h3><p>Create a wagon to get started.</p></div> : <div className="table-container"><table><thead><tr><th>ID</th><th>NUMBER</th><th>TYPE</th><th>MAX CAPACITY</th><th>AVAILABILITY</th></tr></thead><tbody>{wagons.map((wagon) => <tr key={wagon.id}><td>{wagon.id}</td><td>{wagon.wagon_number}</td><td>{wagon.wagon_type}</td><td>{wagon.max_capacity_tons}</td><td><span className={`badge ${wagon.available ? "success" : "warning"}`}>{wagon.available ? "Available" : "Unavailable"}</span></td></tr>)}</tbody></table></div>}
          </div>
        </div>
      </PageShell>
    );
  }

  function renderInventory() {
    return (
      <PageShell title="Inventory" subtitle="Track material availability across locations" rightAction={<button className="primary-button" onClick={() => setActiveView("dashboard")}>← Back</button>}>
        {error ? <div className="error-box">⚠️ {error}</div> : null}
        {success ? <div className="success-box">✓ {success}</div> : null}
        <div className="form-grid">
          <form className="form-card" onSubmit={createInventory}>
            <h3>Create Inventory Item</h3>
            <div className="form-field"><label>Item Code</label><input value={forms.inventory.item_code} onChange={(event) => setForms((current) => ({ ...current, inventory: { ...current.inventory, item_code: event.target.value } }))} required /></div>
            <div className="form-field"><label>Item Name</label><input value={forms.inventory.item_name} onChange={(event) => setForms((current) => ({ ...current, inventory: { ...current.inventory, item_name: event.target.value } }))} required /></div>
            <div className="form-field"><label>Category</label><input value={forms.inventory.category} onChange={(event) => setForms((current) => ({ ...current, inventory: { ...current.inventory, category: event.target.value } }))} required /></div>
            <div className="form-field"><label>Available Units</label><input type="number" value={forms.inventory.available_units} onChange={(event) => setForms((current) => ({ ...current, inventory: { ...current.inventory, available_units: event.target.value } }))} required /></div>
            <div className="form-field"><label>Location</label><input value={forms.inventory.location} onChange={(event) => setForms((current) => ({ ...current, inventory: { ...current.inventory, location: event.target.value } }))} required /></div>
            <div className="form-actions"><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Inventory"}</button></div>
          </form>
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header"><div><h2>Inventory List</h2><p>Inventory items from the backend</p></div></div>
            {loading ? <div className="loading">Loading inventory...</div> : inventory.length === 0 ? <div className="empty-state"><div>📋</div><h3>No inventory items found</h3><p>Create a new inventory item.</p></div> : <div className="table-container"><table><thead><tr><th>CODE</th><th>NAME</th><th>CATEGORY</th><th>UNITS</th><th>LOCATION</th></tr></thead><tbody>{inventory.map((item) => <tr key={item.id}><td>{item.item_code}</td><td>{item.item_name}</td><td>{item.category}</td><td>{item.available_units}</td><td>{item.location}</td></tr>)}</tbody></table></div>}
          </div>
        </div>
      </PageShell>
    );
  }

  function renderFreightRates() {
    return (
      <PageShell title="Freight Rates" subtitle="Manage freight pricing by route" rightAction={<button className="primary-button" onClick={() => setActiveView("dashboard")}>← Back</button>}>
        {error ? <div className="error-box">⚠️ {error}</div> : null}
        {success ? <div className="success-box">✓ {success}</div> : null}
        <div className="form-grid">
          <form className="form-card" onSubmit={createFreightRate}>
            <h3>Create Freight Rate</h3>
            <div className="form-field"><label>Route Code</label><input value={forms.freightRate.route_code} onChange={(event) => setForms((current) => ({ ...current, freightRate: { ...current.freightRate, route_code: event.target.value } }))} required /></div>
            <div className="form-field"><label>Origin</label><input value={forms.freightRate.origin} onChange={(event) => setForms((current) => ({ ...current, freightRate: { ...current.freightRate, origin: event.target.value } }))} required /></div>
            <div className="form-field"><label>Destination</label><input value={forms.freightRate.destination} onChange={(event) => setForms((current) => ({ ...current, freightRate: { ...current.freightRate, destination: event.target.value } }))} required /></div>
            <div className="form-field"><label>Rate per Ton</label><input type="number" value={forms.freightRate.rate_per_ton} onChange={(event) => setForms((current) => ({ ...current, freightRate: { ...current.freightRate, rate_per_ton: event.target.value } }))} required /></div>
            <div className="form-field"><label>Effective From</label><input type="datetime-local" value={forms.freightRate.effective_from} onChange={(event) => setForms((current) => ({ ...current, freightRate: { ...current.freightRate, effective_from: event.target.value } }))} required /></div>
            <div className="form-actions"><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Freight Rate"}</button></div>
          </form>
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header"><div><h2>Freight Rate List</h2><p>Pricing rules coming from the backend</p></div></div>
            {loading ? <div className="loading">Loading freight rates...</div> : freightRates.length === 0 ? <div className="empty-state"><div>💰</div><h3>No freight rates found</h3><p>Create a freight rate entry.</p></div> : <div className="table-container"><table><thead><tr><th>ROUTE</th><th>ORIGIN</th><th>DESTINATION</th><th>RATE / TON</th><th>EFFECTIVE FROM</th></tr></thead><tbody>{freightRates.map((rate) => <tr key={rate.id}><td>{rate.route_code}</td><td>{rate.origin}</td><td>{rate.destination}</td><td>{rate.rate_per_ton}</td><td>{rate.effective_from}</td></tr>)}</tbody></table></div>}
          </div>
        </div>
      </PageShell>
    );
  }

  function renderRailwayRules() {
    return (
      <PageShell title="Railway Rules" subtitle="Manage operational constraints and rules" rightAction={<button className="primary-button" onClick={() => setActiveView("dashboard")}>← Back</button>}>
        {error ? <div className="error-box">⚠️ {error}</div> : null}
        {success ? <div className="success-box">✓ {success}</div> : null}
        <div className="form-grid">
          <form className="form-card" onSubmit={createRailwayRule}>
            <h3>Create Railway Rule</h3>
            <div className="form-field"><label>Rule Code</label><input value={forms.railwayRule.rule_code} onChange={(event) => setForms((current) => ({ ...current, railwayRule: { ...current.railwayRule, rule_code: event.target.value } }))} required /></div>
            <div className="form-field"><label>Description</label><textarea value={forms.railwayRule.description} onChange={(event) => setForms((current) => ({ ...current, railwayRule: { ...current.railwayRule, description: event.target.value } }))} required /></div>
            <div className="form-field"><label>Priority</label><input type="number" value={forms.railwayRule.priority} onChange={(event) => setForms((current) => ({ ...current, railwayRule: { ...current.railwayRule, priority: event.target.value } }))} required /></div>
            <div className="form-field"><label>Active</label><select value={forms.railwayRule.active ? "true" : "false"} onChange={(event) => setForms((current) => ({ ...current, railwayRule: { ...current.railwayRule, active: event.target.value === "true" } }))}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="form-actions"><button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Rule"}</button></div>
          </form>
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header"><div><h2>Railway Rule List</h2><p>Rules loaded from the backend</p></div></div>
            {loading ? <div className="loading">Loading railway rules...</div> : railwayRules.length === 0 ? <div className="empty-state"><div>📜</div><h3>No railway rules found</h3><p>Create a rule to define operational constraints.</p></div> : <div className="table-container"><table><thead><tr><th>RULE CODE</th><th>DESCRIPTION</th><th>PRIORITY</th><th>STATUS</th></tr></thead><tbody>{railwayRules.map((rule) => <tr key={rule.id}><td>{rule.rule_code}</td><td>{rule.description}</td><td>{rule.priority}</td><td><span className={`badge ${rule.active ? "success" : "warning"}`}>{rule.active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div>}
          </div>
        </div>
      </PageShell>
    );
  }

  function renderRakePlans() {
  return (
    <PageShell
      title="Rake Plans"
      subtitle="Review generated planning records"
      rightAction={
        <button
          className="primary-button"
          onClick={() => setActiveView("dashboard")}
        >
          ← Back
        </button>
      }
    >
      {error ? <div className="error-box">⚠️ {error}</div> : null}

      {success ? <div className="success-box">✓ {success}</div> : null}

      {loading ? (
        <div className="loading">Loading rake plans...</div>
      ) : rakePlans.length === 0 ? (
        <div className="empty-state">
          <div>🚆</div>
          <h3>No rake plans found</h3>
          <p>Planning entries will appear here once they are created.</p>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Generated Rake Plans</h2>
              <p>Click a plan to view its details</p>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PLAN CODE</th>
                  <th>PLAN NAME</th>
                  <th>OBJECTIVE</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                </tr>
              </thead>

              <tbody>
                {rakePlans.map((plan) => (
                  <tr
                    key={plan.id}
                    onClick={() => {
                      setSuccess(
                        `Selected ${plan.plan_code} - ${plan.plan_name}`
                      );

                      alert(
                        `RAKE PLAN DETAILS\n\n` +
                        `Plan Code: ${plan.plan_code || "-"}\n` +
                        `Plan Name: ${plan.plan_name || "-"}\n` +
                        `Objective: ${plan.objective || "-"}\n` +
                        `Status: ${plan.status || "-"}\n` +
                        `Created: ${plan.created_at || "-"}`
                      );
                    }}
                    style={{
                      cursor: "pointer",
                    }}
                    title="Click to view plan details"
                  >
                    <td>
                      <strong>{plan.plan_code || "-"}</strong>
                    </td>

                    <td>{plan.plan_name || "-"}</td>

                    <td>{plan.objective || "-"}</td>

                    <td>
                      <span
                        className={`badge ${
                          plan.status?.toLowerCase() === "draft"
                            ? "warning"
                            : plan.status?.toLowerCase() === "approved"
                            ? "success"
                            : ""
                        }`}
                      >
                        {plan.status || "-"}
                      </span>
                    </td>

                    <td>{plan.created_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
}

  function renderRecommendations() {
    const latestRecommendation = recommendations[0];

    return (
      <PageShell title="AI Rake Formation Recommendation" subtitle="Generate a data-driven rake recommendation from an existing order" rightAction={<button className="primary-button" onClick={() => setActiveView("dashboard")}>← Back</button>}>
        {error ? <div className="error-box">⚠️ {error}</div> : null}
        {success ? <div className="success-box">✓ {success}</div> : null}

        <div className="form-grid">
          <div className="form-card">
            <h3>Select Order</h3>
            <div className="form-field">
              <label>Order</label>
              <select value={selectedOrderId} onChange={handleOrderSelection}>
                <option value="">Choose an order</option>
                {orders.map((order) => (
                  <option key={order.order_id} value={order.order_id}>
                    #{order.order_id} — {order.customer_name} — {order.material_name} — {order.quantity} tons — {order.destination}
                  </option>
                ))}
              </select>
            </div>
            {selectedOrder ? (
              <div className="inline-grid">
                <div className="form-field">
                  <label>Customer</label>
                  <input value={selectedOrder.customer_name} readOnly />
                </div>
                <div className="form-field">
                  <label>Material</label>
                  <input value={selectedOrder.material_name} readOnly />
                </div>
                <div className="form-field">
                  <label>Grade</label>
                  <input value={selectedOrder.grade} readOnly />
                </div>
                <div className="form-field">
                  <label>Quantity</label>
                  <input value={selectedOrder.quantity} readOnly />
                </div>
                <div className="form-field">
                  <label>Destination</label>
                  <input value={selectedOrder.destination} readOnly />
                </div>
                <div className="form-field">
                  <label>Priority</label>
                  <input value={selectedOrder.priority} readOnly />
                </div>
                <div className="form-field">
                  <label>Delivery Date</label>
                  <input value={selectedOrder.delivery_date} readOnly />
                </div>
                <div className="form-field">
                  <label>Status</label>
                  <input value={selectedOrder.status} readOnly />
                </div>
              </div>
            ) : null}
            <div className="form-actions">
              <button className="primary-button" type="button" onClick={() => generateRecommendation(selectedOrderId)} disabled={recommendationLoading || !selectedOrderId}>
                {recommendationLoading ? "Generating recommendation..." : "Generate AI Recommendation"}
              </button>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-header">
              <div><h2>AI Recommendation</h2><p>Live output from the backend planner</p></div>
            </div>
            {!latestRecommendation ? (
              <div className="empty-state"><div>🤖</div><h3>No recommendation generated yet</h3><p>Select an order and generate a recommendation to see the result here.</p></div>
            ) : (
              <div className="recommendation-card">
                <div className="recommendation-header">
                  <div>
                    <h3>Order #{latestRecommendation.order_id}</h3>
                    <p>{latestRecommendation.material || "-"} • {latestRecommendation.quantity || "-"} tons • {latestRecommendation.destination || "-"}</p>
                  </div>
                  <span className={`badge ${latestRecommendation.decision === "APPROVED" ? "success" : latestRecommendation.decision === "REVIEW REQUIRED" ? "warning" : "danger"}`}>{latestRecommendation.decision || "-"}</span>
                </div>

                <div className="recommendation-summary">
                  <div className="summary-tile">
                    <small>Recommended Plant</small>
                    <strong>{latestRecommendation.recommended_plant || "-"}</strong>
                  </div>
                  <div className="summary-tile">
                    <small>Recommended Wagons</small>
                    <strong>{latestRecommendation.recommended_wagons || latestRecommendation.allocated_wagons || 0}</strong>
                  </div>
                  <div className="summary-tile">
                    <small>Estimated Freight Cost</small>
                    <strong>{latestRecommendation.estimated_freight_cost ?? latestRecommendation.estimated_cost ?? 0}</strong>
                  </div>
                </div>

                <div className="recommendation-summary">
                  <div className="summary-tile">
                    <small>Confidence</small>
                    <strong>{Math.round((latestRecommendation.confidence || 0) * 100)}%</strong>
                  </div>
                  <div className="summary-tile">
                    <small>Origin</small>
                    <strong>{latestRecommendation.origin || "-"}</strong>
                  </div>
                  <div className="summary-tile">
                    <small>Estimated Time</small>
                    <strong>{latestRecommendation.estimated_time || "-"}</strong>
                  </div>
                </div>

                <div className="recommendation-section">
                  <h4>Why this decision?</h4>
                  <ul className="reason-list">
                    {(latestRecommendation.reasons && latestRecommendation.reasons.length > 0 ? latestRecommendation.reasons : [latestRecommendation.reason || "No detailed explanation was returned."]).map((reason, index) => (
                      <li key={`${reason}-${index}`}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {latestRecommendation.warnings && latestRecommendation.warnings.length > 0 ? (
                  <div className="recommendation-section">
                    <h4>Warnings</h4>
                    <ul className="reason-list">
                      {latestRecommendation.warnings.map((warning, index) => (
                        <li key={`${warning}-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="recommendation-section">
                  <h4>Constraints checked</h4>
                  <div className="constraint-list">
                    {(latestRecommendation.constraints_checked && latestRecommendation.constraints_checked.length > 0 ? latestRecommendation.constraints_checked : ["Inventory", "Plant Capacity", "Wagon Capacity", "Freight Rate", "Railway Rules"]).map((constraint) => (
                      <span key={constraint} className="constraint-pill">✓ {constraint}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  function renderView() {
    switch (activeView) {
      case "orders":
        return renderOrders();
      case "plants":
        return renderPlants();
      case "wagons":
        return renderWagons();
      case "inventory":
        return renderInventory();
      case "freight-rates":
        return renderFreightRates();
      case "railway-rules":
        return renderRailwayRules();
      case "rake-plans":
        return renderRakePlans();
      case "recommendations":
        return renderRecommendations();
      case "dashboard":
      default:
        return renderDashboard();
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">🚆</div>
          <div>
            <h2>Rake Formation</h2>
            <span>Decision Support</span>
          </div>
        </div>
        <nav className="navigation">
          <div className="nav-section">
            <p>MAIN</p>
            <button className={`nav-item ${activeView === "dashboard" ? "active" : ""}`} onClick={() => setActiveView("dashboard")}><span>📊</span>Dashboard</button>
            <button className={`nav-item ${activeView === "orders" ? "active" : ""}`} onClick={() => setActiveView("orders")}><span>📦</span>Orders</button>
            <button className={`nav-item ${activeView === "plants" ? "active" : ""}`} onClick={() => setActiveView("plants")}><span>🏭</span>Plants</button>
            <button className={`nav-item ${activeView === "wagons" ? "active" : ""}`} onClick={() => setActiveView("wagons")}><span>🚂</span>Wagons</button>
            <button className={`nav-item ${activeView === "inventory" ? "active" : ""}`} onClick={() => setActiveView("inventory")}><span>📋</span>Inventory</button>
          </div>
          <div className="nav-section">
            <p>PLANNING</p>
            <button className={`nav-item ${activeView === "freight-rates" ? "active" : ""}`} onClick={() => setActiveView("freight-rates")}><span>💰</span>Freight Rates</button>
            <button className={`nav-item ${activeView === "railway-rules" ? "active" : ""}`} onClick={() => setActiveView("railway-rules")}><span>📜</span>Railway Rules</button>
            <button className={`nav-item ${activeView === "rake-plans" ? "active" : ""}`} onClick={() => setActiveView("rake-plans")}><span>🚆</span>Rake Plans</button>
            <button className={`nav-item ${activeView === "recommendations" ? "active" : ""}`} onClick={() => setActiveView("recommendations")}><span>🤖</span>AI Recommendations</button>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className={`status-pill ${backendConnected ? "online" : "offline"}`}><span className="dot" />{backendConnected ? "Online" : "Offline"}</div>
        </div>
      </aside>
      <main className="main">{renderView()}</main>
    </div>
  );
}

export default App;