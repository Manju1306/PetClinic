import { Link } from 'react-router-dom';
import { IOwner } from '../../types';

interface IProps {
  owner: IOwner;
}

const OwnerInformation = ({ owner }: IProps) => (
  <section>
    <h2>Owner Information</h2>

    <table className="pc-table">
      <tbody>
        <tr>
          <th>Name</th>
          <td>
            <b>
              {owner.first_name} {owner.last_name}
            </b>
          </td>
        </tr>
        <tr>
          <th>Address</th>
          <td>{owner.address}</td>
        </tr>
        <tr>
          <th>City</th>
          <td>{owner.city}</td>
        </tr>
        <tr>
          <th>Telephone</th>
          <td>{owner.telephone}</td>
        </tr>
      </tbody>
    </table>

    <div className="mt-4 flex flex-wrap gap-2">
      <Link to={`/owners/${owner.id}/edit`} className="btn-default">
        Edit Owner
      </Link>
      <Link to={`/owners/${owner.id}/pets/new`} className="btn-default">
        Add New Pet
      </Link>
    </div>
  </section>
);

export default OwnerInformation;
