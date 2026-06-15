import { IConstraint } from '../../types';

export const NotEmpty: IConstraint = {
  message: 'Enter at least one character',
  validate: (value) => !!value && value.length > 0,
};

export const Digits = (digits: number): IConstraint => {
  const reg = new RegExp('^\\d{1,' + digits + '}$');
  return {
    message: 'Must be a number with at most ' + digits + ' digits',
    validate: (value) => !!value && value.match(reg) !== null,
  };
};

export const Email: IConstraint = {
  message: 'Enter a valid email address',
  validate: (value) => !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
};

export const MinLength = (length: number): IConstraint => ({
  message: `Must be at least ${length} characters`,
  validate: (value) => !!value && String(value).length >= length,
});
