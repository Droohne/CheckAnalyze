import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Shops from './pages/Shops';
import Catalog from './pages/Catalog';
import Templates from './pages/Templates';
import Settings from './pages/Settings';

function Navigation() {
  const location = useLocation();
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
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>JD</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;