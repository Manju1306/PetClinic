import type { RouteObject } from 'react-router-dom';

import App from './components/App';
import WelcomePage from './components/WelcomePage';
import UserHomePage from './components/UserHomePage';
import { useAuth } from './auth/AuthContext';

const HomePage = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <WelcomePage /> : <UserHomePage />;
};
import FindOwnersPage from './components/owners/FindOwnersPage';
import OwnersPage from './components/owners/OwnersPage';
import NewOwnerPage from './components/owners/NewOwnerPage';
import EditOwnerPage from './components/owners/EditOwnerPage';
import NewPetPage from './components/pets/NewPetPage';
import EditPetPage from './components/pets/EditPetPage';
import VisitsPage from './components/visits/VisitsPage';
import VetsPage from './components/vets/VetsPage';
import VetEditorPage from './components/vets/VetEditorPage';
import ErrorPage from './components/ErrorPage';
import NotFoundPage from './components/NotFoundPage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import RequireAuth from './auth/RequireAuth';
import RequireAdmin from './auth/RequireAdmin';
import UsersPage from './components/admin/UsersPage';
import MyPetsPage from './components/owners/MyPetsPage';
import ProfilePage from './components/profile/ProfilePage';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'my-pets', element: <MyPetsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'owners/list', element: <FindOwnersPage /> },
          { path: 'owners/new', element: <NewOwnerPage /> },
          { path: 'owners/:ownerId/edit', element: <EditOwnerPage /> },
          { path: 'owners/:ownerId/pets/:petId/edit', element: <EditPetPage /> },
          { path: 'owners/:ownerId/pets/new', element: <NewPetPage /> },
          { path: 'owners/:ownerId/pets/:petId/visits/new', element: <VisitsPage /> },
          { path: 'owners/:ownerId/pets/:petId/visits/:visitId', element: <VisitsPage /> },
          { path: 'owners/:ownerId', element: <OwnersPage /> },
          { path: 'vets', element: <VetsPage /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: 'admin/users', element: <UsersPage /> },
              { path: 'vets/new', element: <VetEditorPage /> },
              { path: 'vets/:vetId/edit', element: <VetEditorPage /> },
            ],
          },
        ],
      },
      { path: 'error', element: <ErrorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export default routes;
