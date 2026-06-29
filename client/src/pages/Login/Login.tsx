import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

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
    <div className="login-container">
      <h1 className="login-title">Sign In</h1>
      <p className="login-subtitle">Sign in to your account</p>

      <form onSubmit={handleSubmit}>
        <div className="login-form-group">
          <label className="login-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="john@example.com"
            className="login-input"
          />
        </div>

        <div className="login-form-group">
          <label className="login-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="login-input"
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="login-footer">
        Don't have an account? <a href="#" className="login-link">Sign up</a>
      </p>
    </div>
  );
}

export default Login;