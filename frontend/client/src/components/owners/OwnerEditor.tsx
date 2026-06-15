import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { submitForm, url } from '../../util';
import Input from '../form/Input';
import { Digits, NotEmpty } from '../form/Constraints';

import { IFieldError, IError, IOwner } from '../../types';

interface IOwnerEditorProps {
  initialOwner: IOwner;
}

const OwnerEditor = ({ initialOwner }: IOwnerEditorProps) => {
  const navigate = useNavigate();
  const [owner, setOwner] = useState<IOwner>({ ...initialOwner });
  const [error, setError] = useState<IError | null>(null);

  const onSubmit = (event: React.MouseEvent | React.FormEvent) => {
    event.preventDefault();

    const submitUrl = owner.isNew ? 'api/owners' : 'api/owners/' + owner.id;
    submitForm(
      owner.isNew ? 'POST' : 'PUT',
      url(submitUrl),
      owner,
      (status, response) => {
        if (status === 200 || status === 201) {
          const newOwner = response as IOwner;
          navigate('/owners/' + newOwner.id);
        } else {
          setError(response);
        }
      }
    );
  };

  const onInputChange = (name: string, value: string, fieldError: IFieldError | null) => {
    setOwner((current) => ({ ...current, [name]: value }));
    setError((current) => {
      const fieldErrors = current ? { ...current.fieldErrors } : {};
      if (fieldError) {
        fieldErrors[name] = fieldError;
      } else {
        delete fieldErrors[name];
      }
      return { fieldErrors };
    });
  };

  return (
    <span>
      <h2>{owner.isNew ? 'New Owner' : 'Edit Owner'}</h2>
      <form method="POST" action={url('/api/owner')}>
        <Input
          object={owner}
          error={error}
          constraint={NotEmpty}
          label="First Name"
          name="first_name"
          onChange={onInputChange}
        />
        <Input
          object={owner}
          error={error}
          constraint={NotEmpty}
          label="Last Name"
          name="last_name"
          onChange={onInputChange}
        />
        <Input
          object={owner}
          error={error}
          constraint={NotEmpty}
          label="Address"
          name="address"
          onChange={onInputChange}
        />
        <Input
          object={owner}
          error={error}
          constraint={NotEmpty}
          label="City"
          name="city"
          onChange={onInputChange}
        />
        <Input
          object={owner}
          error={error}
          constraint={Digits(10)}
          label="Telephone"
          name="telephone"
          onChange={onInputChange}
        />
        <div className="mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12">
          <div className="sm:col-span-10 sm:col-start-3">
            <button className="btn-default" type="submit" onClick={onSubmit}>
              {owner.isNew ? 'Add Owner' : 'Update Owner'}
            </button>
          </div>
        </div>
      </form>
    </span>
  );
};

export default OwnerEditor;
