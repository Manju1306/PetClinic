import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import routes from './configureRoutes';

const Root = () => {
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
};

export default Root;
