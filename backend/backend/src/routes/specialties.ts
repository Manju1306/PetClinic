import { Router } from 'express';
import { Specialty } from '../db';
import { asyncHandler, NotFoundError, parseIntParam } from '../middleware';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const specialties = await Specialty.findAll({ order: [['name', 'ASC']] });
    res.json(specialties);
  }),
);

router.get(
  '/:specialtyId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.specialtyId, 'specialtyId');
    const specialty = await Specialty.findByPk(id);
    if (!specialty) throw new NotFoundError('Specialty', id);
    res.json(specialty);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const specialty = await Specialty.create(req.body);
    res.status(201).json(specialty);
  }),
);

router.put(
  '/:specialtyId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.specialtyId, 'specialtyId');
    const specialty = await Specialty.findByPk(id);
    if (!specialty) throw new NotFoundError('Specialty', id);
    await specialty.update(req.body);
    res.json(specialty);
  }),
);

router.delete(
  '/:specialtyId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.specialtyId, 'specialtyId');
    const deleted = await Specialty.destroy({ where: { id } });
    if (deleted === 0) throw new NotFoundError('Specialty', id);
    res.status(204).send();
  }),
);

export default router;