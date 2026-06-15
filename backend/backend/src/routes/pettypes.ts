import { Router } from 'express';
import { PetType } from '../db';
import { asyncHandler, NotFoundError, parseIntParam } from '../middleware';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const types = await PetType.findAll({ order: [['name', 'ASC']] });
    res.json(types);
  }),
);

router.get(
  '/:petTypeId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.petTypeId, 'petTypeId');
    const type = await PetType.findByPk(id);
    if (!type) throw new NotFoundError('PetType', id);
    res.json(type);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const type = await PetType.create(req.body);
    res.status(201).json(type);
  }),
);

router.put(
  '/:petTypeId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.petTypeId, 'petTypeId');
    const type = await PetType.findByPk(id);
    if (!type) throw new NotFoundError('PetType', id);
    await type.update(req.body);
    res.json(type);
  }),
);

router.delete(
  '/:petTypeId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.petTypeId, 'petTypeId');
    const deleted = await PetType.destroy({ where: { id } });
    if (deleted === 0) throw new NotFoundError('PetType', id);
    res.status(204).send();
  }),
);

export default router;