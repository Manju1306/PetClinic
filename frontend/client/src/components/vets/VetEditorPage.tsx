import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ISpecialty, IError } from '../../types';
import { apiFetch, submitForm, url } from '../../util';
import Input from '../form/Input';
import { NotEmpty } from '../form/Constraints';

interface IEditableVet {
  id: number | null;
  isNew: boolean;
  first_name: string;
  last_name: string;
  specialtyIds: number[];
}

const VetEditorPage = () => {
  const navigate = useNavigate();
  const { vetId } = useParams<{ vetId: string }>();
  const isNew = !vetId;

  const [vet, setVet] = useState<IEditableVet | null>(null);
  const [allSpecialties, setAllSpecialties] = useState<ISpecialty[]>([]);
  const [error, setError] = useState<IError | null>(null);

  useEffect(() => {
    apiFetch('api/specialties')
      .then((r) => r.json())
      .then((data) => setAllSpecialties(data));

    if (isNew) {
      setVet({ id: null, isNew: true, first_name: '', last_name: '', specialtyIds: [] });
    } else {
      apiFetch(`api/vets/${vetId}`)
        .then((r) => r.json())
        .then((data) => {
          setVet({
            id: data.id,
            isNew: false,
            first_name: data.first_name,
            last_name: data.last_name,
            specialtyIds: data.specialties?.map((s: any) => s.id) ?? [],
          });
        });
    }
  }, [vetId, isNew]);

  const onInputChange = (name: string, value: string) => {
    setVet((current) => (current ? { ...current, [name]: value } : current));
  };

  const onSpecialtyToggle = (id: number) => {
    setVet((current) => {
      if (!current) return current;
      const ids = current.specialtyIds.includes(id)
        ? current.specialtyIds.filter((sid) => sid !== id)
        : [...current.specialtyIds, id];
      return { ...current, specialtyIds: ids };
    });
  };

  const onSubmit = (event: React.MouseEvent | React.FormEvent) => {
    event.preventDefault();
    if (!vet) return;

    const request = {
      first_name: vet.first_name,
      last_name: vet.last_name,
      specialties: vet.specialtyIds,
    };

    const method = isNew ? 'POST' : 'PUT';
    const submitUrl = isNew ? url('api/vets') : url(`api/vets/${vet.id}`);

    submitForm(method, submitUrl, request, (status, response) => {
      if (status === 200 || status === 201 || status === 204) {
        navigate('/vets');
      } else {
        setError(response);
      }
    });
  };

  if (!vet) {
    return <h2>Loading...</h2>;
  }

  return (
    <span>
      <h2>{isNew ? 'Add Veterinarian' : 'Edit Veterinarian'}</h2>
      <form method="POST" onSubmit={onSubmit}>
        <Input
          object={vet}
          error={error}
          constraint={NotEmpty}
          label="First Name"
          name="first_name"
          onChange={onInputChange}
        />
        <Input
          object={vet}
          error={error}
          constraint={NotEmpty}
          label="Last Name"
          name="last_name"
          onChange={onInputChange}
        />

        <div className="mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12 sm:items-start">
          <label className="col-form-label sm:col-span-2 sm:text-right">Specialties</label>
          <div className="sm:col-span-10 flex flex-wrap gap-3">
            {allSpecialties.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vet.specialtyIds.includes(s.id as number)}
                  onChange={() => onSpecialtyToggle(s.id as number)}
                  className="accent-spring-green"
                />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12">
          <div className="sm:col-span-10 sm:col-start-3">
            <button className="btn-default" type="submit" onClick={onSubmit}>
              {isNew ? 'Add Vet' : 'Update Vet'}
            </button>
          </div>
        </div>
      </form>
    </span>
  );
};

export default VetEditorPage;
