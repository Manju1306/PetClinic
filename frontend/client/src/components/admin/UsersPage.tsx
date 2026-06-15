import { useEffect, useState } from 'react';

import { apiFetch } from '../../util';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

interface IUserRow {
  username: string;
  email: string | null;
  enabled: boolean;
  roles: { id: number; role: string }[];
}

const UsersPage = () => {
  const [users, setUsers] = useState<IUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = () => {
    apiFetch('api/users')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load users');
        return response.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    const response = await apiFetch(`api/users/${username}`, { method: 'DELETE' });
    if (response.status === 204) {
      loadUsers();
    } else {
      const body = await response.json().catch(() => ({}));
      setError(body.message || 'Failed to delete user');
    }
  };

  return (
    <span>
      <h2>User Management</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <table className="pc-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Status</th>
            <th>Roles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.email || '-'}</td>
              <td>
                <span className={user.enabled ? 'text-spring-green' : 'text-red-600'}>
                  {user.enabled ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td>{user.roles.map((r) => r.role).join(', ')}</td>
              <td>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(user.username)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </span>
  );
};

export default UsersPage;
