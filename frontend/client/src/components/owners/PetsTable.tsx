import { Link } from 'react-router-dom';
import { IOwner, IPet } from '../../types';
import { apiFetch, toIsoDate } from '../../util';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface IVisitsListProps {
  ownerId: number;
  pet: IPet;
  onRefresh: () => void;
}

const VisitsList = ({ ownerId, pet, onRefresh }: IVisitsListProps) => {
  const handleDelete = async (visitId: number) => {
    if (!confirm('Are you sure you want to delete this visit?')) return;
    const response = await apiFetch(`api/visits/${visitId}`, { method: 'DELETE' });
    if (response.status === 204) {
      onRefresh();
    }
  };

  if (pet.visits.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400 mb-3">No visits yet</p>
        <Link to={`/owners/${ownerId}/pets/${pet.id}/visits/new`}>
          <Button variant="outline" size="sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Schedule Visit
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Visit History</h4>
        <Link to={`/owners/${ownerId}/pets/${pet.id}/visits/new`}>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add
          </Button>
        </Link>
      </div>
      {pet.visits.map((visit) => (
        <div
          key={visit.id ?? visit.description}
          className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 group"
        >
          <div className="min-w-0 flex-1">
            <Link
              to={`/owners/${ownerId}/pets/${pet.id}/visits/${visit.id}`}
              className="text-sm font-medium text-spring-dark-green hover:underline"
            >
              {toIsoDate(visit.visit_date)}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{visit.description}</p>
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-600 mt-0.5 shrink-0"
            onClick={() => visit.id && handleDelete(visit.id)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

function petTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t === 'dog') return '🐕';
  if (t === 'cat') return '🐈';
  if (t === 'bird') return '🐦';
  if (t === 'snake') return '🐍';
  if (t === 'lizard') return '🦎';
  if (t === 'hamster') return '🐹';
  return '🐾';
}

interface IProps {
  owner: IOwner;
  onRefresh: () => void;
}

const PetsTable = ({ owner, onRefresh }: IProps) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {owner.pets.map((pet) => (
      <Card key={pet.id ?? pet.name} className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{petTypeIcon(pet.type.name)}</span>
              <div>
                <CardTitle className="text-lg">{pet.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{pet.type.name}</Badge>
                </div>
              </div>
            </div>
            <Link to={`/owners/${owner.id}/pets/${pet.id}/edit`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-spring-green">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Born {toIsoDate(pet.birth_date ?? null)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-t border-gray-100 pt-3">
            <VisitsList ownerId={owner.id as number} pet={pet} onRefresh={onRefresh} />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default PetsTable;
