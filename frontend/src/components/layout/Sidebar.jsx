import { BellDot, ChartColumn, ChevronLeft, ChevronRight, Factory, FileText, Gauge, Package2, ShieldCheck, TrainFront, Truck, Warehouse, Wrench, Settings, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';

const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: Gauge },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Orders', to: '/orders', icon: FileText },
      { label: 'Inventory', to: '/inventory', icon: Warehouse },
      { label: 'Plants', to: '/plants', icon: Factory },
      { label: 'Wagons', to: '/wagons', icon: TrainFront },
    ],
  },
  {
    title: 'Planning',
    items: [
      { label: 'Rake Plans', to: '/rake-plans', icon: ChartColumn },
      { label: 'Recommendations', to: '/recommendations', icon: BellDot },
      { label: 'Optimization', to: '/recommendations', icon: Gauge },
    ],
  },
  {
    title: 'Railway',
    items: [
      { label: 'Railway Rules', to: '/railway-rules', icon: ShieldCheck },
      { label: 'Freight Rates', to: '/freight-rates', icon: Truck },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Approvals', to: '/approvals', icon: Users },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar__header">
        <BrandLogo compact={collapsed} />
        <button type="button" className="sidebar__toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Sidebar navigation">
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            {!collapsed && <p>{section.title}</p>}
            {section.items.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="online-indicator" />
        {!collapsed && <span>System online</span>}
      </div>
    </aside>
  );
}
