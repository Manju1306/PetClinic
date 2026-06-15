import { IError, IInputChangeHandler, ISelectOption } from '../../types';
import FieldFeedbackPanel from './FieldFeedbackPanel';

interface IProps {
  object: any;
  error: IError | null | undefined;
  name: string;
  label: string;
  options: ISelectOption[];
  onChange: IInputChangeHandler;
}

const SelectInput = ({ object, error, name, label, options, onChange }: IProps) => {
  const handleOnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(name, event.target.value, null);
  };

  const selectedValue = object[name] || '';
  const fieldError = error?.fieldErrors?.[name];
  const valid = !fieldError && selectedValue !== '';

  return (
    <div
      className={`mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12 sm:items-start${
        fieldError ? ' has-error' : ''
      }`}
    >
      <label className="col-form-label sm:col-span-2 sm:text-right">{label}</label>
      <div className="sm:col-span-10">
        <select
          size={5}
          className={`pc-form-control${fieldError ? ' is-invalid' : ''}`}
          name={name}
          onChange={handleOnChange}
          value={selectedValue}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value as string}>
              {option.name}
            </option>
          ))}
        </select>
        <FieldFeedbackPanel valid={valid} fieldError={fieldError} />
      </div>
    </div>
  );
};

export default SelectInput;
