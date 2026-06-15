import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { IOwner, IEditablePet, ISelectOption } from '../../types';

import LoadingPanel from './LoadingPanel';
import PetEditor from './PetEditor';
import createPetEditorModel from './createPetEditorModel';

interface IModel {
  pet?: IEditablePet;
  owner?: IOwner;
  pettypes?: ISelectOption[];
}

const NEW_PET: IEditablePet = {
  id: null,
  isNew: true,
  name: '',
  birth_date: null,
  typeId: null,
};

const NewPetPage = () => {
  const { ownerId } = useParams<{ ownerId: string }>();
  const [model, setModel] = useState<IModel | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    createPetEditorModel(ownerId, Promise.resolve(NEW_PET)).then((m) => setModel(m));
  }, [ownerId]);

  if (!model) {
    return <LoadingPanel />;
  }
  return <PetEditor pet={model.pet!} owner={model.owner!} pettypes={model.pettypes!} />;
};

export default NewPetPage;
