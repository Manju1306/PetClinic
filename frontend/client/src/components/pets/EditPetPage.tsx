import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { IOwner, IEditablePet, ISelectOption } from '../../types';
import { url } from '../../util';

import LoadingPanel from './LoadingPanel';
import PetEditor from './PetEditor';
import createPetEditorModel from './createPetEditorModel';

interface IModel {
  pet?: IEditablePet;
  owner?: IOwner;
  pettypes?: ISelectOption[];
}

const EditPetPage = () => {
  const { ownerId, petId } = useParams<{ ownerId: string; petId: string }>();
  const [model, setModel] = useState<IModel | null>(null);

  useEffect(() => {
    if (!ownerId || !petId) return;
    const fetchUrl = url(`api/owners/${ownerId}/pets/${petId}`);
    const loadPetPromise = fetch(fetchUrl).then((response) => response.json());

    createPetEditorModel(ownerId, loadPetPromise).then((m) => setModel(m));
  }, [ownerId, petId]);

  if (!model) {
    return <LoadingPanel />;
  }
  return <PetEditor pet={model.pet!} owner={model.owner!} pettypes={model.pettypes!} />;
};

export default EditPetPage;
