import { Bell, HelpCircle, Search, ChevronDown, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../api';
import { notify } from '../../utils/toast';

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
  const navigate = useNavigate();
  const currentLabel = breadcrumbMap[location.pathname] || 'Dashboard';

  function searchOrders(event) {
    event.preventDefault();
    const query = searchValue.trim();
    if (!query) return;
    navigate(`/orders?search=${encodeURIComponent(query)}`);
  }

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
        <form className="topbar__search" onSubmit={searchOrders} role="search">
          <Search size={16} />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search orders..."
            aria-label="Search orders"
          />
        </form>

        <button type="button" className="icon-button" aria-label="Notifications" onClick={() => navigate('/approvals')}>
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <button type="button" className="icon-button" aria-label="Help" onClick={() => {
          window.open(`${API_BASE_URL}/docs`, '_blank', 'noopener,noreferrer');
          notify({ type: 'info', message: 'Opened the backend API documentation in a new tab.' });
        }}>
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
