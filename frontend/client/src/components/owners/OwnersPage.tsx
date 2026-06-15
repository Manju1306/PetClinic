import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IOwner } from '../../types';
import { apiFetch } from '../../util';

import OwnerInformation from './OwnerInformation';
import PetsTable from './PetsTable';

const OwnersPage = () => {
  const { ownerId } = useParams<{ ownerId: string }>();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<IOwner | null>(null);

  const loadOwner = useCallback(() => {
    if (!ownerId) return;
    apiFetch(`api/owners/${ownerId}`)
      .then((response) => {
        if (response.status === 403) {
          navigate('/error', { state: { status: 403, message: 'Access denied. You can only view your own profile.' }, replace: true });
          return null;
        }
        if (response.status === 404) {
          navigate('/error', { state: { status: 404, message: 'Owner not found.' }, replace: true });
          return null;
        }
        if (!response.ok) {
          navigate('/error', { state: { status: response.status, message: 'Failed to load owner.' }, replace: true });
          return null;
        }
        return response.json();
      })
      .then((data) => { if (data) setOwner(data); });
  }, [ownerId, navigate]);

  useEffect(() => {
    loadOwner();
  }, [loadOwner]);

  if (!owner) {
    return <h2>Loading...</h2>;
  }

  return (
    <span>
      <OwnerInformation owner={owner} />
      <PetsTable owner={owner} onRefresh={loadOwner} />
    </span>
  );
};

export default OwnersPage;
