import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import PageLayout from './components/layout/PageLayout';
import ToastContainer from './components/common/ToastContainer';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Plants from './pages/Plants';
import Wagons from './pages/Wagons';
import RakePlans from './pages/RakePlans';
import Recommendations from './pages/Recommendations';
import RailwayRules from './pages/RailwayRules';
import FreightRates from './pages/FreightRates';
import Approvals from './pages/Approvals';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { authenticateUser, getDemoUser, getStoredAuth, clearAuth, saveAuth } from './services/auth';
import { notify } from './utils/toast';

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRouter() {
  const [user, setUser] = useState(() => getStoredAuth() || null);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      saveAuth(user);
    } else {
      clearAuth();
    }
  }, [user]);

  const handleLogin = (email, password, role) => {
    if (!email || !password) {
      notify({ type: 'warning', message: 'Please enter both email and password.' });
      return;
    }

    const account = authenticateUser(email, password, role);
    if (!account) {
      notify({ type: 'error', message: 'Email, password, or selected role does not match this account.' });
      return;
    }

    setUser(account);
    notify({ type: 'success', message: `Welcome back, ${account.name.split(' ')[0]}.` });
    navigate(account.role === 'Approver' ? '/approvals' : account.role === 'Planner' ? '/rake-plans' : '/dashboard');
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    notify({ type: 'info', message: 'You have been logged out.' });
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        element={
          <ProtectedRoute user={user}>
            <PageLayout user={user} onLogout={handleLogout} searchValue={searchValue} onSearchChange={setSearchValue} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/plants" element={<Plants />} />
        <Route path="/wagons" element={<Wagons />} />
        <Route path="/rake-plans" element={<RakePlans />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/railway-rules" element={<RailwayRules />} />
        <Route path="/freight-rates" element={<FreightRates />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <ToastContainer />
    </>
  );
}

export default App;
