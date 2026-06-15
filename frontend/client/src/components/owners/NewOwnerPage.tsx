import OwnerEditor from './OwnerEditor';
import { IOwner } from '../../types';

const newOwner = (): IOwner => ({
  id: null,
  isNew: true,
  first_name: '',
  last_name: '',
  address: '',
  city: '',
  telephone: '',
  pets: [],
});

const NewOwnerPage = () => <OwnerEditor initialOwner={newOwner()} />;

export default NewOwnerPage;
