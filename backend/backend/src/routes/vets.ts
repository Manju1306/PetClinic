import { Router } from 'express';
import { Vet, Specialty, VetSpecialty } from '../db';
import { asyncHandler, BadRequestError, NotFoundError, parseIntParam } from '../middleware';
import { requireRole } from '../auth/middleware';

const router = Router();

const vetInclude = [{ model: Specialty, as: 'specialties', through: { attributes: [] } }];

/** Extract specialty ids from request body. Accepts [1, 2, 3] or [{id: 1}, {id: 2}]. */
function extractSpecialtyIds(input: unknown): number[] {
  if (!Array.isArray(input)) throw new BadRequestError('specialties must be an array');
  return input.map(s => {
    if (typeof s === 'number') return s;
    if (s && typeof s === 'object' && typeof (s as { id?: unknown }).id === 'number') {
      return (s as { id: number }).id;
    }
    throw new BadRequestError('Each specialty must be a number or include an id field');
  });
}

async function syncVetSpecialties(vetId: number, specialtyIds: number[]): Promise<void> {
  await VetSpecialty.destroy({ where: { vet_id: vetId } });
  if (specialtyIds.length > 0) {
    await VetSpecialty.bulkCreate(specialtyIds.map(specialty_id => ({ vet_id: vetId, specialty_id })));
  }
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const vets = await Vet.findAll({ include: vetInclude, order: [['id', 'ASC']] });
    res.json(vets);
  }),
);

router.get(
  '/:vetId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.vetId, 'vetId');
    const vet = await Vet.findByPk(id, { include: vetInclude });
    if (!vet) throw new NotFoundError('Vet', id);
    res.json(vet);
  }),
);

router.post(
  '/',
  requireRole('ROLE_ADMIN', 'ROLE_VET_ADMIN'),
  asyncHandler(async (req, res) => {
    const { specialties, ...vetData } = req.body ?? {};
    const vet = await Vet.create(vetData);
    if (specialties !== undefined) {
      await syncVetSpecialties(vet.id, extractSpecialtyIds(specialties));
    }
    const created = await Vet.findByPk(vet.id, { include: vetInclude });
    res.status(201).json(created);
  }),
);

router.put(
  '/:vetId',
  requireRole('ROLE_ADMIN', 'ROLE_VET_ADMIN'),
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.vetId, 'vetId');
    const vet = await Vet.findByPk(id);
    if (!vet) throw new NotFoundError('Vet', id);
    const { specialties, ...vetData } = req.body ?? {};
    await vet.update(vetData);
    if (specialties !== undefined) {
      await syncVetSpecialties(id, extractSpecialtyIds(specialties));
    }
    const updated = await Vet.findByPk(id, { include: vetInclude });
    res.json(updated);
  }),
);

router.delete(
  '/:vetId',
  requireRole('ROLE_ADMIN', 'ROLE_VET_ADMIN'),
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.vetId, 'vetId');
    await VetSpecialty.destroy({ where: { vet_id: id } });
    const deleted = await Vet.destroy({ where: { id } });
    if (deleted === 0) throw new NotFoundError('Vet', id);
    res.status(204).send();
  }),
);

export default router;