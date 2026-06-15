import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import OwnerEditor from './OwnerEditor';
import { IOwner } from '../../types';
import { apiFetch } from '../../util';

const EditOwnerPage = () => {
  const { ownerId } = useParams<{ ownerId: string }>();
  const [owner, setOwner] = useState<IOwner | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    apiFetch(`api/owners/${ownerId}`)
      .then((response) => response.json())
      .then((data) => setOwner(data));
  }, [ownerId]);

  if (!owner) return null;
  return <OwnerEditor initialOwner={owner} />;
};

export default EditOwnerPage;
