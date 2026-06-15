import { fireEvent, render } from '@testing-library/react';

import { IConstraint } from '../../../../src/types';
import Input from '../../../../src/components/form/Input';

describe('Input', () => {
  let object: { myField: string };
  let onChangeResult: { name: string; value: string; error: any } | null;

  const onChange = (name: string, value: string, error: any) => {
    onChangeResult = { name, value, error };
  };

  beforeEach(() => {
    object = { myField: 'blabla' };
    onChangeResult = null;
  });

  it('should render correctly without field error', () => {
    const error = { fieldErrors: {} };

    const { container } = render(
      <Input
        object={object}
        label="My Field"
        name="myField"
        error={error}
        onChange={onChange}
      />
    );

    const label = container.querySelector('.col-form-label')!;
    expect(label.textContent).toBe('My Field');

    const input = container.querySelector('input')!;
    expect(input.value).toBe('blabla');

    expect(container.querySelectorAll('.has-error').length).toBe(0);
    expect(container.querySelectorAll('.is-invalid').length).toBe(0);

    fireEvent.change(input, { target: { value: 'My new value' } });

    expect(onChangeResult).toBeTruthy();
    expect(onChangeResult!.name).toBe('myField');
    expect(onChangeResult!.value).toBe('My new value');
    expect(onChangeResult!.error).toBeFalsy();
  });

  it('should render correctly with field error', () => {
    const error = {
      fieldErrors: {
        myField: { field: 'myField', message: 'There was an error' },
      },
    };

    const { container } = render(
      <Input
        object={object}
        label="My Field"
        name="myField"
        error={error}
        onChange={onChange}
      />
    );

    const label = container.querySelector('.col-form-label')!;
    expect(label.textContent).toBe('My Field');

    const input = container.querySelector('input')!;
    expect(input.value).toBe('blabla');

    expect(container.querySelectorAll('.has-error').length).toBe(1);
    expect(container.querySelectorAll('.is-invalid').length).toBe(1);
  });

  it('should check constraints on input change', () => {
    const error = { fieldErrors: {} };
    const constraint: IConstraint = {
      message: 'Invalid',
      validate: vi.fn(),
    };

    const { container } = render(
      <Input
        object={object}
        label="My Field"
        name="myField"
        error={error}
        onChange={onChange}
        constraint={constraint}
      />
    );

    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'My new value' } });

    expect(constraint.validate).toHaveBeenCalledWith('My new value');
  });
});
