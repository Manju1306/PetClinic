import { Router } from 'express';
import { Pet, PetType, Owner, Visit } from '../db';
import { asyncHandler, NotFoundError, parseIntParam } from '../middleware';

const router = Router();

const petInclude = [
  { model: PetType, as: 'type' },
  { model: Owner, as: 'owner' },
  { model: Visit, as: 'visits' },
];

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const pets = await Pet.findAll({ include: petInclude, order: [['id', 'ASC']] });
    res.json(pets);
  }),
);

router.get(
  '/:petId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.petId, 'petId');
    const pet = await Pet.findByPk(id, { include: petInclude });
    if (!pet) throw new NotFoundError('Pet', id);
    res.json(pet);
  }),
);

router.put(
  '/:petId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.petId, 'petId');
    const pet = await Pet.findByPk(id);
    if (!pet) throw new NotFoundError('Pet', id);
    await pet.update(req.body);
    res.json(pet);
  }),
);

router.delete(
  '/:petId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.petId, 'petId');
    const deleted = await Pet.destroy({ where: { id } });
    if (deleted === 0) throw new NotFoundError('Pet', id);
    res.status(204).send();
  }),
);

export default router;