import { Link } from 'react-router-dom';

import { IOwner } from '../../types';

const renderRow = (owner: IOwner) => (
  <tr key={owner.id ?? `${owner.first_name}-${owner.last_name}`}>
    <td>
      <Link to={`/owners/${owner.id}`}>
        {owner.first_name} {owner.last_name}
      </Link>
    </td>
    <td className="hidden md:table-cell">{owner.address}</td>
    <td>{owner.city}</td>
    <td>{owner.telephone}</td>
    <td className="hidden sm:table-cell">
      {owner.pets.map((pet) => pet.name).join(', ')}
    </td>
  </tr>
);

const renderOwners = (owners: IOwner[]) => (
  <section>
    <h2>{owners.length} Owners found</h2>
    <table className="pc-table">
      <thead>
        <tr>
          <th>Name</th>
          <th className="hidden md:table-cell">Address</th>
          <th>City</th>
          <th>Telephone</th>
          <th className="hidden sm:table-cell">Pets</th>
        </tr>
      </thead>
      <tbody>{owners && owners.map(renderRow)}</tbody>
    </table>
  </section>
);

interface IProps {
  owners: IOwner[] | null | undefined;
}

const OwnersTable = ({ owners }: IProps) => (owners ? renderOwners(owners) : null);

export default OwnersTable;
