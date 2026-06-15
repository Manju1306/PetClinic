import { Outlet, useLocation } from 'react-router-dom';
import Menu from './Menu';
import ChatWidget from './chat/ChatWidget';

const App = () => {
  const location = useLocation();

  return (
    <div>
      <Menu name={location.pathname} />
      <div className="xd-container mx-auto w-full max-w-screen-xl px-4">
        <Outlet />

        <div className="mt-10 text-center">
          <img
            className="inline-block max-w-full h-auto"
            src="/images/spring-pivotal-logo.png"
            alt="Sponsored by Pivotal"
          />
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};

export default App;
