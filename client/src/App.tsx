import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home/Home';
import Shops from './pages/Shops/Shops';
import Catalog from './pages/Catalog/Catalog';
import Templates from './pages/Templates/Templates';
import Settings from './pages/Settings/Settings';
import Login from './pages/Login/Login';
import Profile from './pages/Profile/Profile';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import global styles
import './styles/variables.css';
import './styles/common.css';
import './styles/components.css';

function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { path: '/', label: 'Home' },
    { path: '/shops', label: 'Shops' },
    { path: '/catalog', label: 'Catalog' },
    { path: '/templates', label: 'Templates' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <div className="nav-container">
      <span className="nav-logo">⚡ Aggregator</span>
      <div className="nav-links">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`nav-link ${location.pathname === link.path ? 'nav-link-active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        {user ? (
          <>
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="nav-avatar"
            >
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            {showProfileMenu && (
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item">
                  👤 Profile
                </Link>
                <button
                  onClick={() => { handleLogout(); setShowProfileMenu(false); }}
                  className="dropdown-item dropdown-item-danger"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        <Navigation />
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/shops" element={
            <ProtectedRoute>
              <Shops />
            </ProtectedRoute>
          } />
          <Route path="/catalog" element={
            <ProtectedRoute>
              <Catalog />
            </ProtectedRoute>
          } />
          <Route path="/templates" element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;