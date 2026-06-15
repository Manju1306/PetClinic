import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { IOwner } from '../../types';
import { apiFetch } from '../../util';

import OwnersTable from './OwnersTable';

const FindOwnersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const last_name_param = searchParams.get('last_name');
  const [filter, setFilter] = useState<string>(last_name_param ?? '');
  const [owners, setOwners] = useState<IOwner[] | null>(null);

  useEffect(() => {
    if (last_name_param === null) return;
    const query = last_name_param ? encodeURIComponent(last_name_param) : '';
    apiFetch('api/owners?last_name=' + query)
      .then((response) => response.json())
      .then((data) => setOwners(data));
    setFilter(last_name_param);
  }, [last_name_param]);

  const onFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  };

  const submitSearchForm = () => {
    navigate({
      pathname: '/owners/list',
      search: `?last_name=${encodeURIComponent(filter || '')}`,
    });
  };

  return (
    <span>
      <section>
        <h2>Find Owners</h2>

        <form action="javascript:void(0)">
          <div
            className="mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12 sm:items-center"
            id="last_name"
          >
            <label className="col-form-label sm:col-span-2 sm:text-right">
              Last name{' '}
            </label>
            <div className="sm:col-span-10">
              <input
                className="pc-form-control"
                name="filter"
                value={filter}
                onChange={onFilterChange}
                size={30}
                maxLength={80}
              />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-x-4 sm:grid-cols-12">
            <div className="sm:col-span-10 sm:col-start-3">
              <button
                type="button"
                onClick={submitSearchForm}
                className="btn-default"
              >
                Find Owner
              </button>
            </div>
          </div>
        </form>
      </section>
      <OwnersTable owners={owners} />
      <Link className="btn-default" to="/owners/new">
        Add Owner
      </Link>
    </span>
  );
};

export default FindOwnersPage;
