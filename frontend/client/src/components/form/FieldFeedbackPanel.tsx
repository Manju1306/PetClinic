import { IFieldError } from '../../types';

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="inline-block text-green-600"
  >
    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
  </svg>
);

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="inline-block text-red-600"
  >
    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
  </svg>
);

interface IProps {
  valid: boolean;
  fieldError: IFieldError | null | undefined;
}

const FieldFeedbackPanel = ({ valid, fieldError }: IProps) => {
  if (valid) {
    return <CheckIcon />;
  }

  if (fieldError) {
    return (
      <span className="mt-1 inline-flex items-center gap-2">
        <XIcon />
        <span className="invalid-feedback text-sm text-red-600">{fieldError.message}</span>
      </span>
    );
  }

  return null;
};

export default FieldFeedbackPanel;
