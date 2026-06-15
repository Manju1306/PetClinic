import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthError, useAuth } from '../../auth/AuthContext';
import { IError } from '../../types';

import { Button } from '../ui/button';
import { ShadcnInput } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

interface ILoginFormState {
  username: string;
  password: string;
}

const initialState: ILoginFormState = { username: '', password: '' };

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  const [form, setForm] = useState<ILoginFormState>(initialState);
  const [error, setError] = useState<IError | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof AuthError && err.fieldErrors) {
        setError(err.fieldErrors);
      }
      setSubmitError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your PetClinic account</CardDescription>
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
                placeholder="Enter your username"
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
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={onInputChange}
                className={error?.fieldErrors?.password ? 'border-red-500' : ''}
              />
              {error?.fieldErrors?.password && (
                <p className="text-sm text-red-600">{error.fieldErrors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Log In'}
            </Button>
            <p className="text-sm text-gray-500">
              Need an account?{' '}
              <Link to="/signup" className="text-spring-green hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
