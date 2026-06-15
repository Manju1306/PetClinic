import { IConstraint, IError, IInputChangeHandler } from '../../types';
import FieldFeedbackPanel from './FieldFeedbackPanel';

const NoConstraint: IConstraint = {
  message: '',
  validate: () => true,
};

interface IProps {
  object: any;
  error: IError | null | undefined;
  name: string;
  constraint?: IConstraint;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  onChange: IInputChangeHandler;
}

const Input = ({
  object,
  error,
  name,
  constraint = NoConstraint,
  label,
  type = 'text',
  autoComplete,
  onChange,
}: IProps) => {
  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const fieldError =
      constraint.validate(value) === false
        ? { field: name, message: constraint.message }
        : null;
    onChange(name, value, fieldError);
  };

  const value = object[name] ?? '';
  const fieldError = error?.fieldErrors?.[name];
  const valid =
    !fieldError && value !== null && value !== undefined && String(value).trim().length > 0;

  return (
    <div
      className={`mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12 sm:items-center${
        fieldError ? ' has-error' : ''
      }`}
    >
      <label className="col-form-label sm:col-span-2 sm:text-right">{label}</label>
      <div className="sm:col-span-10">
        <input
          type={type}
          name={name}
          autoComplete={autoComplete}
          className={`pc-form-control${fieldError ? ' is-invalid' : ''}`}
          value={value}
          onChange={handleOnChange}
        />
        <FieldFeedbackPanel valid={valid} fieldError={fieldError} />
      </div>
    </div>
  );
};

export default Input;
