import { Router } from 'express';
import { Visit, Pet } from '../db';
import { asyncHandler, NotFoundError, parseIntParam } from '../middleware';

const router = Router();

const visitInclude = [{ model: Pet, as: 'pet' }];

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const visits = await Visit.findAll({ include: visitInclude, order: [['visit_date', 'DESC']] });
    res.json(visits);
  }),
);

router.get(
  '/:visitId',
  asyncHandler(async (req, res) => {
    console.log('GET /api/visits/:visitId params:', JSON.stringify(req.params));
    const id = parseIntParam(req.params.visitId, 'visitId');
    const visit = await Visit.findByPk(id, { include: visitInclude });
    if (!visit) throw new NotFoundError('Visit', id);
    res.json(visit);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    console.log('POST /api/visits body:', JSON.stringify(req.body));
    const visit = await Visit.create(req.body);
    res.status(201).json(visit);
  }),
);

router.put(
  '/:visitId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.visitId, 'visitId');
    const visit = await Visit.findByPk(id);
    if (!visit) throw new NotFoundError('Visit', id);
    await visit.update(req.body);
    res.json(visit);
  }),
);

router.delete(
  '/:visitId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.visitId, 'visitId');
    const deleted = await Visit.destroy({ where: { id } });
    if (deleted === 0) throw new NotFoundError('Visit', id);
    res.status(204).send();
  }),
);

export default router;