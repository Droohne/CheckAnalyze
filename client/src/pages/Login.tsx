import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
          console.log('1. Attempting login...');
          const user = await login(email, password);
          console.log('2. Login success, user:', user);
          console.log('3. Navigating to /');
          navigate('/');
          console.log('4. Navigate called');
      } catch (err: any) {
          console.log('5. Login error:', err);
          setError(err.response?.data?.message || 'Invalid email or password');
      } finally {
          console.log('6. Setting loading false');
          setLoading(false);
      }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '80px auto',
      padding: '40px',
      background: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', textAlign: 'center' }}>Sign In</h1>
      <p style={{ color: '#64748b', textAlign: 'center', margin: '0 0 32px 0', fontSize: '14px' }}>
        Sign in to your account
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#0f172a' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="john@example.com"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#0f172a' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#94a3b8' : '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
        Don't have an account? <a href="#" style={{ color: '#6366f1', textDecoration: 'none' }}>Sign up</a>
      </p>
    </div>
  );
}

export default Login;