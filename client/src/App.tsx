import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Shops from './pages/Shops';
import Catalog from './pages/Catalog';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

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
    <div style={{ 
      background: '#ffffff', 
      borderBottom: '1px solid #e2e8f0', 
      padding: '0 40px', 
      height: '64px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>⚡ Aggregator</span>
      </div>
      <div style={{ display: 'flex', gap: '28px', fontSize: '14px', color: '#475569' }}>
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              textDecoration: 'none',
              color: location.pathname === link.path ? '#0f172a' : '#475569',
              fontWeight: location.pathname === link.path ? '500' : '400',
              borderBottom: location.pathname === link.path ? '2px solid #0f172a' : 'none',
              paddingBottom: '20px',
            }}
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
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: '#6366f1', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                background: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                minWidth: '180px',
                overflow: 'hidden',
                zIndex: 200,
              }}>
                <Link to="/profile" style={{
                  display: 'block',
                  padding: '10px 16px',
                  color: '#0f172a',
                  textDecoration: 'none',
                  fontSize: '14px',
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  👤 Profile
                </Link>
                <button
                  onClick={() => { handleLogout(); setShowProfileMenu(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <Link to="/login" style={{
            padding: '8px 20px',
            background: '#0f172a',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}>
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
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
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