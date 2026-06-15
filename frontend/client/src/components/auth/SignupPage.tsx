import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthError, useAuth } from '../../auth/AuthContext';
import { IError } from '../../types';

import { Button } from '../ui/button';
import { ShadcnInput } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

interface ISignupFormState {
  username: string;
  password: string;
  confirmPassword: string;
}

const initialState: ISignupFormState = { username: '', password: '', confirmPassword: '' };

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<ISignupFormState>(initialState);
  const [error, setError] = useState<IError | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.username.length < 3) {
      setError({ fieldErrors: { username: { field: 'username', message: 'Username must be at least 3 characters' } } });
      return;
    }
    if (form.password.length < 8) {
      setError({ fieldErrors: { password: { field: 'password', message: 'Password must be at least 8 characters' } } });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError({ fieldErrors: { confirmPassword: { field: 'confirmPassword', message: 'Passwords do not match' } } });
      return;
    }

    setSubmitError(null);
    setError(null);
    setSubmitting(true);
    try {
      await signup({ username: form.username, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.fieldErrors) {
        setError(err.fieldErrors);
      }
      setSubmitError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up for a PetClinic account</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <ShadcnInput
                id="username"
                name="username"
                autoComplete="username"
                placeholder="Choose a username (min 3 chars)"
                value={form.username}
                onChange={onInputChange}
                className={error?.fieldErrors?.username ? 'border-red-500' : ''}
              />
              {error?.fieldErrors?.username && (
                <p className="text-sm text-red-600">{error.fieldErrors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <ShadcnInput
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a password (min 8 chars)"
                value={form.password}
                onChange={onInputChange}
                className={error?.fieldErrors?.password ? 'border-red-500' : ''}
              />
              {error?.fieldErrors?.password && (
                <p className="text-sm text-red-600">{error.fieldErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <ShadcnInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={onInputChange}
                className={error?.fieldErrors?.confirmPassword ? 'border-red-500' : ''}
              />
              {error?.fieldErrors?.confirmPassword && (
                <p className="text-sm text-red-600">{error.fieldErrors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-spring-green hover:underline font-medium">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignupPage;
