import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { submitForm, url } from '../../util';
import Input from '../form/Input';
import DateInput from '../form/DateInput';
import SelectInput from '../form/SelectInput';

import {
  IError,
  IOwner,
  IPetRequest,
  IEditablePet,
  ISelectOption,
} from '../../types';

interface IPetEditorProps {
  pet: IEditablePet;
  owner: IOwner;
  pettypes: ISelectOption[];
}

const PetEditor = ({ pet, owner, pettypes }: IPetEditorProps) => {
  const navigate = useNavigate();
  const [editablePet, setEditablePet] = useState<IEditablePet>({ ...pet });
  const [error, setError] = useState<IError | null>(null);

  const onInputChange = (name: string, value: string) => {
    setEditablePet((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = (event: React.MouseEvent | React.FormEvent) => {
    event.preventDefault();

    const request = {
      birth_date: editablePet.birth_date,
      name: editablePet.name,
      type_id: editablePet.typeId,
    };

    const submitUrl = editablePet.isNew
      ? 'api/owners/' + owner.id + '/pets'
      : 'api/owners/' + owner.id + '/pets/' + editablePet.id;

    submitForm(
      editablePet.isNew ? 'POST' : 'PUT',
      url(submitUrl),
      request,
      (status, response) => {
        if (status === 200 || status === 201 || status === 204) {
          navigate('/owners/' + owner.id);
        } else {
          setError(response);
        }
      }
    );
  };

  const formLabel = editablePet.isNew ? 'Add Pet' : 'Update Pet';

  return (
    <span>
      <h2>{formLabel}</h2>
      <form method="POST" action={url('/api/owner')}>
        <div className="mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12 sm:items-center">
          <label className="col-form-label sm:col-span-2 sm:text-right">Owner</label>
          <div className="sm:col-span-10">
            {owner.first_name} {owner.last_name}
          </div>
        </div>

        <Input
          object={editablePet}
          error={error}
          label="Name"
          name="name"
          onChange={onInputChange}
        />
        <DateInput
          object={editablePet}
          error={error}
          label="Birth date"
          name="birth_date"
          onChange={onInputChange}
        />
        <SelectInput
          object={editablePet}
          error={error}
          label="Type"
          name="typeId"
          options={pettypes}
          onChange={onInputChange}
        />

        <div className="mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12">
          <div className="sm:col-span-10 sm:col-start-3">
            <button className="btn-default" type="submit" onClick={onSubmit}>
              {formLabel}
            </button>
          </div>
        </div>
      </form>
    </span>
  );
};

export default PetEditor;
