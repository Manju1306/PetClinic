import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { IOwner } from '../../types';
import { apiFetch } from '../../util';
import { useAuth } from '../../auth/AuthContext';

import PetsTable from './PetsTable';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const MyPetsPage = () => {
  const { user } = useAuth();
  const [owner, setOwner] = useState<IOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  const loadOwner = useCallback(() => {
    if (!user) return;

    if (user.owner_id) {
      apiFetch(`api/owners/${user.owner_id}`)
        .then((response) => {
          if (!response.ok) {
            setNoProfile(true);
            setLoading(false);
            return null;
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            setOwner(data);
            setNoProfile(false);
          }
          setLoading(false);
        });
    } else {
      apiFetch('api/owners')
        .then((response) => response.json())
        .then((data: IOwner[]) => {
          if (data.length > 0) {
            setOwner(data[0]);
            setNoProfile(false);
          } else {
            setNoProfile(true);
          }
          setLoading(false);
        });
    }
  }, [user]);

  useEffect(() => {
    loadOwner();
  }, [loadOwner]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-spring-green border-t-transparent" />
          <p className="text-sm text-gray-500">Loading your pets...</p>
        </div>
      </div>
    );
  }

  if (noProfile || !owner) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <span className="text-5xl mb-4 block">🐾</span>
            <h2 className="text-xl font-semibold text-spring-brown mb-2">No Owner Profile</h2>
            <p className="text-sm text-gray-500 mb-6">
              Create an owner profile to start managing your pets and booking visits.
            </p>
            <Link to="/owners/new">
              <Button>Create Owner Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-spring-brown mb-1">My Pets</h1>
          <p className="text-gray-500">
            Welcome back, <span className="font-semibold text-spring-brown">{owner.first_name} {owner.last_name}</span>
          </p>
        </div>
        <Link to={`/owners/${owner.id}/pets/new`}>
          <Button>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Pet
          </Button>
        </Link>
      </div>

      {/* Pet Cards */}
      {owner.pets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <span className="text-6xl mb-4 block">🐶</span>
            <h3 className="text-lg font-semibold text-spring-brown mb-2">No pets yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Add your first pet to start tracking visits and care.
            </p>
            <Link to={`/owners/${owner.id}/pets/new`}>
              <Button>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Pet
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-2xl font-bold text-spring-green">{owner.pets.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {owner.pets.length === 1 ? 'Pet' : 'Pets'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-2xl font-bold text-spring-green">
                  {owner.pets.reduce((sum, p) => sum + p.visits.length, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Visits</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5 text-center">
                <p className="text-2xl font-bold text-spring-green">
                  {new Set(owner.pets.map(p => p.type.name)).size}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Set(owner.pets.map(p => p.type.name)).size === 1 ? 'Type' : 'Types'}
                </p>
              </CardContent>
            </Card>
          </div>

          <PetsTable owner={owner} onRefresh={loadOwner} />
        </>
      )}
    </section>
  );
};

export default MyPetsPage;
