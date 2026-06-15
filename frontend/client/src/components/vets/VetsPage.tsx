import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { IVet } from '../../types';
import { apiFetch } from '../../util';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../ui/button';

const VetsPage = () => {
  const [vets, setVets] = useState<IVet[]>([]);
  const { isAdmin } = useAuth();

  const loadVets = () => {
    apiFetch('api/vets')
      .then((response) => response.json())
      .then((data) => setVets(data));
  };

  useEffect(() => {
    loadVets();
  }, []);

  const handleDelete = async (vetId: number) => {
    if (!confirm('Are you sure you want to delete this veterinarian?')) return;
    const response = await apiFetch(`api/vets/${vetId}`, { method: 'DELETE' });
    if (response.status === 204) {
      loadVets();
    }
  };

  return (
    <span>
      <h2>Veterinarians</h2>
      <table className="pc-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialties</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {vets.map((vet) => (
            <tr key={vet.id ?? `${vet.first_name}-${vet.last_name}`}>
              <td>
                {vet.first_name} {vet.last_name}
              </td>
              <td>
                {vet.specialties.length > 0
                  ? vet.specialties.map((specialty) => specialty.name).join(', ')
                  : 'none'}
              </td>
              {isAdmin && (
                <td className="flex gap-2">
                  <Link to={`/vets/${vet.id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => vet.id && handleDelete(vet.id)}
                  >
                    Delete
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {isAdmin && (
        <div className="mt-4">
          <Link to="/vets/new" className="btn-default">
            Add Veterinarian
          </Link>
        </div>
      )}
    </span>
  );
};

export default VetsPage;
