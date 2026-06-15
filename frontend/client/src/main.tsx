import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import './styles/app.css';

import routes from './configureRoutes';
import { AuthProvider } from './auth/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const router = createBrowserRouter(routes);

const mountPoint = document.getElementById('mount');
if (mountPoint) {
  createRoot(mountPoint).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
