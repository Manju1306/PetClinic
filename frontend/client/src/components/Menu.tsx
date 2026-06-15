import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

const itemClasses =
  'flex items-center gap-2 px-5 py-2 md:py-7 uppercase tracking-wide text-sm font-display text-spring-light-grey transition-colors hover:bg-spring-green';
const activeClasses = 'bg-spring-green';

interface IMenuItemProps {
  active: boolean;
  url: string;
  title: string;
  children?: React.ReactNode;
  onNavigate?: () => void;
}

const MenuItem = ({ active, url, title, children, onNavigate }: IMenuItemProps) => (
  <li>
    <Link
      className={`${itemClasses}${active ? ` ${activeClasses}` : ''}`}
      to={url}
      title={title}
      onClick={onNavigate}
    >
      {children}
    </Link>
  </li>
);

const HouseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.793V14.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V7.793l5-5z" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
  </svg>
);

const ListTaskIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5zM3 3H2v1h1z" />
    <path d="M5 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M5.5 7a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 4a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z" />
    <path fillRule="evenodd" d="M1.5 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5zM2 7h1v1H2zm0 3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm1 .5H2v1h1z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
  </svg>
);

const PawIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
    <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5 .3-86.2 32.6-96.8 70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3 29.1 51.7 10.2 84.1-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5 46.9 53.9 32.6 96.8-52.1 69.1-84.4 58.5z"/>
  </svg>
);

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
  </svg>
);

interface IMenuProps {
  name: string;
}

const Menu = ({ name }: IMenuProps) => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLLIElement>(null);
  const close = () => setOpen(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    close();
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      role="navigation"
      className="border-t-4 border-spring-green bg-spring-brown"
    >
      <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center px-4">
        <Link
          to="/"
          onClick={close}
          className="my-3 inline-flex h-12 items-center text-spring-light-grey no-underline"
          title="Spring PetClinic"
        >
          <span className="font-display text-lg font-bold uppercase tracking-wider">
            Spring PetClinic
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-controls="main-navbar"
          aria-expanded={open}
          aria-label="Toggle navigation"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded border border-spring-light-grey/40 text-spring-light-grey md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
          </svg>
        </button>

        <div
          id="main-navbar"
          className={`${open ? 'block' : 'hidden'} w-full md:ml-auto md:block md:w-auto`}
        >
          <ul className="flex w-full flex-col md:flex-row md:items-center">
            <MenuItem active={name === '/'} url="/" title="home page" onNavigate={close}>
              <HouseIcon />
              <span>Home</span>
            </MenuItem>

            {isAdmin ? (
              <MenuItem active={name.startsWith('/owners')} url="/owners/list" title="find owners" onNavigate={close}>
                <SearchIcon />
                <span>Find Owners</span>
              </MenuItem>
            ) : (
              <MenuItem active={name === '/my-pets'} url="/my-pets" title="my pets" onNavigate={close}>
                <PawIcon />
                <span>My Pets</span>
              </MenuItem>
            )}

            <MenuItem active={name === '/vets'} url="/vets" title="veterinarians" onNavigate={close}>
              <ListTaskIcon />
              <span>Veterinarians</span>
            </MenuItem>

            {isAdmin && (
              <MenuItem active={name === '/admin/users'} url="/admin/users" title="manage users" onNavigate={close}>
                <UsersIcon />
                <span>Users</span>
              </MenuItem>
            )}

            {isAuthenticated ? (
              <li ref={profileRef} className="relative md:ml-auto">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className={`${itemClasses} w-full cursor-pointer`}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <ProfileIcon />
                  <span>{user?.username}</span>
                  {isAdmin && <span className="text-xs text-spring-green">(admin)</span>}
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={`ml-1 transition-transform ${profileOpen ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="md:absolute md:right-0 md:top-full md:z-50 md:min-w-[200px] md:rounded-b-lg md:shadow-lg bg-spring-brown md:border md:border-spring-light-grey/20">
                    <div className="px-4 py-3 border-b border-spring-light-grey/20">
                      <p className="text-sm text-spring-light-grey font-display">{user?.username}</p>
                      {isAdmin && <p className="text-xs text-spring-green">Administrator</p>}
                    </div>
                    <ul className="py-1">
                      <li>
                        <Link
                          to="/profile"
                          onClick={() => { close(); setProfileOpen(false); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-spring-light-grey hover:bg-spring-green transition-colors font-display"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325" />
                          </svg>
                          Update Profile
                        </Link>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={onLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-spring-light-grey hover:bg-spring-green transition-colors font-display cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
                            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
                          </svg>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </li>
            ) : (
              <MenuItem active={name === '/login'} url="/login" title="log in" onNavigate={close}>
                <span>Log in</span>
              </MenuItem>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Menu;
