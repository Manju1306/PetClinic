import { useLocation } from 'react-router-dom';

const ErrorPage = () => {
  const location = useLocation();
  const state = location.state as { status?: number; message?: string } | null;

  const status = state?.status || 500;
  const message = state?.message || 'An unexpected error occurred.';

  return (
    <span>
      <h2>Something happened...</h2>
      <p>
        <b>Status:</b> {status}
      </p>
      <p>
        <b>Message:</b> {message}
      </p>
      <p className="mt-4">
        <a href="/" className="btn-default">
          Go Home
        </a>
      </p>
    </span>
  );
};

export default ErrorPage;
