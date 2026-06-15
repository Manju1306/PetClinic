import { IOwner, IPet } from '../../types';
import { toIsoDate } from '../../util';

interface IProps {
  owner: IOwner;
  pet: IPet;
}

const PetDetails = ({ owner, pet }: IProps) => (
  <table className="pc-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Birth Date</th>
        <th>Type</th>
        <th>Owner</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{pet.name}</td>
        <td>{toIsoDate(pet.birth_date ?? null)}</td>
        <td>{pet.type.name}</td>
        <td>
          {owner.first_name} {owner.last_name}
        </td>
      </tr>
    </tbody>
  </table>
);

export default PetDetails;
