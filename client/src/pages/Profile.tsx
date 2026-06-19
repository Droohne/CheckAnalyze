import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, changePassword, deleteAccount, getUserStats } from '../api/client';
import { useQuery } from '@tanstack/react-query';

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
    return <div style={{ padding: '40px', textAlign: 'center' }}>Please log in</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 6px 0' }}>👤 Profile</h1>
      <p style={{ color: '#64748b', margin: '0 0 32px 0', fontSize: '16px' }}>
        Manage your account settings
      </p>

      {message && (
        <div style={{
          background: '#dcfce7',
          color: '#16a34a',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#ef4444',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.totalChecks}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Checks</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.totalProducts}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Products</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.totalUniqueProducts}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Unique</div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div style={{
        background: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Profile Information</h2>
        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: loading ? '#94a3b8' : '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div style={{
        background: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: loading ? '#94a3b8' : '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Change Password
          </button>
        </form>
      </div>

      {/* Delete Account */}
      <div style={{
        background: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #fee2e2',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#ef4444' }}>Danger Zone</h2>
        <button
          onClick={handleDeleteAccount}
          style={{
            padding: '10px 24px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Profile;