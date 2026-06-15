import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch } from '../../util';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const initialEmail = user?.email ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg(null);
    try {
      const res = await apiFetch('api/auth/me/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update email');
      }
      setEmailMsg({ type: 'success', text: 'Email updated successfully.' });
      refreshUser();
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: err.message });
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPwSaving(true);
    try {
      const res = await apiFetch('api/auth/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to change password');
      }
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <section>
      <h2>My Profile</h2>

      <div className="max-w-lg">
        {/* Account Info */}
        <div className="mb-8 rounded-lg border border-spring-grey/30 bg-white p-6">
          <h3 className="mt-0 mb-4 text-lg font-display">Account Information</h3>
          <div className="mb-3">
            <label className="col-form-label font-bold">Username</label>
            <p className="text-spring-grey">{user?.username}</p>
          </div>
          <form onSubmit={handleEmailSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="col-form-label font-bold">Email</label>
              <input
                id="email"
                type="email"
                className="pc-form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            {emailMsg && (
              <p className={`mb-3 text-sm ${emailMsg.type === 'success' ? 'text-spring-green' : 'text-red-600'}`}>
                {emailMsg.text}
              </p>
            )}
            <button type="submit" className="btn-default" disabled={emailSaving}>
              {emailSaving ? 'Saving...' : 'Update Email'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-lg border border-spring-grey/30 bg-white p-6">
          <h3 className="mt-0 mb-4 text-lg font-display">Change Password</h3>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-3">
              <label htmlFor="currentPassword" className="col-form-label font-bold">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                className="pc-form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="newPassword" className="col-form-label font-bold">New Password</label>
              <input
                id="newPassword"
                type="password"
                className="pc-form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="col-form-label font-bold">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="pc-form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {pwMsg && (
              <p className={`mb-3 text-sm ${pwMsg.type === 'success' ? 'text-spring-green' : 'text-red-600'}`}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" className="btn-default" disabled={pwSaving}>
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
