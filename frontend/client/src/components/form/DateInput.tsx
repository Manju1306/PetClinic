import DatePicker from 'react-datepicker';

import { IError, IInputChangeHandler } from '../../types';
import FieldFeedbackPanel from './FieldFeedbackPanel';

interface IProps {
  object: any;
  error: IError | null | undefined;
  name: string;
  label: string;
  onChange: IInputChangeHandler;
}

const formatYmd = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseYmd = (value: string): Date | null => {
  if (!value) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const DateInput = ({ object, error, name, label, onChange }: IProps) => {
  const handleOnChange = (value: Date | null) => {
    onChange(name, value ? formatYmd(value) : '', null);
  };

  const selectedValue = object[name] ? parseYmd(object[name]) : null;
  const fieldError = error?.fieldErrors?.[name];
  const valid = !fieldError && selectedValue != null;

  return (
    <div
      className={`mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12 sm:items-center${
        fieldError ? ' has-error' : ''
      }`}
    >
      <label className="col-form-label sm:col-span-2 sm:text-right">{label}</label>
      <div className="sm:col-span-10">
        <DatePicker
          selected={selectedValue}
          onChange={handleOnChange}
          className={`pc-form-control${fieldError ? ' is-invalid' : ''}`}
          dateFormat="yyyy-MM-dd"
        />
        <FieldFeedbackPanel valid={valid} fieldError={fieldError} />
      </div>
    </div>
  );
};

export default DateInput;
