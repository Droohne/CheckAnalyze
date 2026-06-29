import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, changePassword, deleteAccount, getUserStats } from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import './Profile.css';

function Profile() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => getUserStats().then(r => r.data),
    enabled: !!user,
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await updateProfile({ name, email });
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setMessage('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;

    try {
      await deleteAccount();
      logout();
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };

  if (!user) {
    return <div className="loading-state">Please log in</div>;
  }

  return (
    <div className="profile-container">
      <h1 className="page-title">👤 Profile</h1>
      <p className="page-subtitle">Manage your account settings</p>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-value">{stats.totalChecks}</div>
            <div className="profile-stat-label">Checks</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{stats.totalProducts}</div>
            <div className="profile-stat-label">Products</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-value">{stats.totalUniqueProducts}</div>
            <div className="profile-stat-label">Unique</div>
          </div>
        </div>
      )}

      <div className="profile-section">
        <h2 className="profile-section-title">Profile Information</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="profile-form-group">
            <label className="profile-form-label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="profile-form-input"
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="profile-form-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            Save Changes
          </button>
        </form>
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="profile-form-group">
            <label className="profile-form-label">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="profile-form-input"
            />
          </div>
          <div className="profile-form-group">
            <label className="profile-form-label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="profile-form-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            Change Password
          </button>
        </form>
      </div>

      <div className="profile-section profile-section-danger">
        <h2 className="profile-section-title profile-section-danger-title">Danger Zone</h2>
        <button
          onClick={handleDeleteAccount}
          className="btn btn-danger"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Profile;