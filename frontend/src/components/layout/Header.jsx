import { Bell, HelpCircle, Search, ChevronDown, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const breadcrumbMap = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/inventory': 'Inventory',
  '/plants': 'Plants',
  '/wagons': 'Wagons',
  '/rake-plans': 'Rake Plans',
  '/recommendations': 'Recommendations',
  '/railway-rules': 'Railway Rules',
  '/freight-rates': 'Freight Rates',
  '/approvals': 'Approvals',
  '/settings': 'Settings',
};

export default function Header({ user, onLogout, searchValue, onSearchChange, compact = false }) {
  const location = useLocation();
  const currentLabel = breadcrumbMap[location.pathname] || 'Dashboard';

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__crumbs">
          <span className="crumb-label">Operations</span>
          <span>/</span>
          <strong>{currentLabel}</strong>
        </div>
      </div>

      <div className="topbar__actions">
        <div className="topbar__search">
          <Search size={16} />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search operations..."
            aria-label="Global search"
          />
        </div>

        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <button type="button" className="icon-button" aria-label="Help">
          <HelpCircle size={18} />
        </button>

        <div className="profile-box">
          <div className="profile-box__avatar">{user?.avatar || 'OM'}</div>
          <div className="profile-box__meta">
            <strong>{user?.name || 'Operations Manager'}</strong>
            <span>{user?.role || 'Operations Manager'}</span>
          </div>
          <ChevronDown size={16} />
        </div>

        <button type="button" className="logout-button" onClick={onLogout}>
          <LogOut size={16} />
          {!compact && <span>Logout</span>}
        </button>
      </div>
    </header>
  );
}
