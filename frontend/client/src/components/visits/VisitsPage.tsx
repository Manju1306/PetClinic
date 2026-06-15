import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IOwner, IVisit, IError } from '../../types';

import { apiFetch, submitForm, toIsoDate, url } from '../../util';
import { NotEmpty } from '../form/Constraints';

import DateInput from '../form/DateInput';
import Input from '../form/Input';
import PetDetails from './PetDetails';

const VisitsPage = () => {
  const navigate = useNavigate();
  const { ownerId, petId, visitId } = useParams<{ ownerId: string; petId: string; visitId: string }>();

  const isNew = !visitId;

  const [owner, setOwner] = useState<IOwner | null>(null);
  const [visit, setVisit] = useState<IVisit | null>(null);
  const [error, setError] = useState<IError | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    apiFetch(`api/owners/${ownerId}`)
      .then((response) => response.json())
      .then((loadedOwner) => {
        setOwner(loadedOwner);
        if (isNew) {
          setVisit({ id: null, isNew: true, visit_date: null, description: '' });
        } else {
          const pet = loadedOwner.pets.find((p: any) => p.id?.toString() === petId);
          const existing = pet?.visits.find((v: any) => v.id?.toString() === visitId);
          if (existing) {
            setVisit({ ...existing, isNew: false });
          }
        }
      });
  }, [ownerId, petId, visitId, isNew]);

  const onSubmit = (event: React.MouseEvent | React.FormEvent) => {
    event.preventDefault();
    if (!owner || !visit) return;

    const request = {
      visit_date: toIsoDate(visit.visit_date),
      description: visit.description,
    };

    if (isNew) {
      const submitUrl = url(`api/owners/${owner.id}/pets/${petId}/visits`);
      submitForm('POST', submitUrl, request, (status, response) => {
        if (status === 201 || status === 204) {
          navigate('/owners/' + owner.id);
        } else {
          setError(response);
        }
      });
    } else {
      const submitUrl = url(`api/visits/${visitId}`);
      submitForm('PUT', submitUrl, request, (status, response) => {
        if (status === 200 || status === 204) {
          navigate('/owners/' + owner.id);
        } else {
          setError(response);
        }
      });
    }
  };

  const onInputChange = (name: string, value: string) => {
    setVisit((current) => (current ? { ...current, [name]: value } : current));
  };

  if (!owner || !visit) {
    return <h2>Loading...</h2>;
  }

  const pet = owner.pets.find((candidate) => candidate.id?.toString() === petId);
  if (!pet) {
    return <h2>Pet not found</h2>;
  }

  return (
    <div>
      <h2>{isNew ? 'New Visit' : 'Edit Visit'}</h2>
      <b>Pet</b>
      <PetDetails owner={owner} pet={pet} />

      <form method="POST" action={url('api/owner')}>
        <DateInput
          object={visit}
          error={error}
          label="Date"
          name="visit_date"
          onChange={onInputChange}
        />
        <Input
          object={visit}
          error={error}
          constraint={NotEmpty}
          label="Description"
          name="description"
          onChange={onInputChange}
        />
        <div className="mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12">
          <div className="sm:col-span-10 sm:col-start-3">
            <button className="btn-default" type="submit" onClick={onSubmit}>
              {isNew ? 'Add Visit' : 'Update Visit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VisitsPage;
