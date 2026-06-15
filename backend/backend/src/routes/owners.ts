import { Router } from 'express';
import { Op } from 'sequelize';
import { Owner, Pet, PetType, Visit } from '../db';
import { asyncHandler, NotFoundError, parseIntParam } from '../middleware';
import { ForbiddenError } from '../auth/middleware';

const router = Router();

const ADMIN_ROLES = ['ROLE_ADMIN', 'ROLE_OWNER_ADMIN'];

function isAdmin(req: Express.Request): boolean {
  return req.user?.roles.some(r => ADMIN_ROLES.includes(r)) ?? false;
}

const ownerInclude = [
  { model: Pet, as: 'pets', include: [{ model: PetType, as: 'type' }, { model: Visit, as: 'visits' }] },
];

/* GET /api/owners?lastName=Smith ------------------------------------------ */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (isAdmin(req)) {
      const lastName = typeof req.query.lastName === 'string' ? req.query.lastName : undefined;
      const where = lastName ? { last_name: { [Op.like]: `${lastName}%` } } : undefined;
      const owners = await Owner.findAll({ where, include: ownerInclude, order: [['id', 'ASC']] });
      res.json(owners);
    } else {
      const username = req.user!.username;
      const owner = await Owner.findOne({ where: { username }, include: ownerInclude });
      res.json(owner ? [owner] : []);
    }
  }),
);

/* GET /api/owners/:ownerId ------------------------------------------------- */
router.get(
  '/:ownerId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.ownerId, 'ownerId');
    const owner = await Owner.findByPk(id, { include: ownerInclude });
    if (!owner) throw new NotFoundError('Owner', id);
    if (!isAdmin(req) && owner.username !== req.user!.username) {
      throw new ForbiddenError('You can only view your own profile');
    }
    res.json(owner);
  }),
);

/* POST /api/owners --------------------------------------------------------- */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!isAdmin(req)) {
      req.body.username = req.user!.username;
    }
    const owner = await Owner.create(req.body);
    res.status(201).json(owner);
  }),
);

/* PUT /api/owners/:ownerId ------------------------------------------------- */
router.put(
  '/:ownerId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.ownerId, 'ownerId');
    const owner = await Owner.findByPk(id);
    if (!owner) throw new NotFoundError('Owner', id);
    if (!isAdmin(req) && owner.username !== req.user!.username) {
      throw new ForbiddenError('You can only edit your own profile');
    }
    await owner.update(req.body);
    res.json(owner);
  }),
);

/* DELETE /api/owners/:ownerId ---------------------------------------------- */
router.delete(
  '/:ownerId',
  asyncHandler(async (req, res) => {
    const id = parseIntParam(req.params.ownerId, 'ownerId');
    if (!isAdmin(req)) {
      throw new ForbiddenError('Only admins can delete owners');
    }
    const deleted = await Owner.destroy({ where: { id } });
    if (deleted === 0) throw new NotFoundError('Owner', id);
    res.status(204).send();
  }),
);

/* GET /api/owners/:ownerId/pets/:petId ------------------------------------- */
router.get(
  '/:ownerId/pets/:petId',
  asyncHandler(async (req, res) => {
    const ownerId = parseIntParam(req.params.ownerId, 'ownerId');
    const petId = parseIntParam(req.params.petId, 'petId');
    if (!isAdmin(req)) {
      const owner = await Owner.findByPk(ownerId);
      if (!owner || owner.username !== req.user!.username) {
        throw new ForbiddenError('You can only view your own pets');
      }
    }
    const pet = await Pet.findOne({
      where: { id: petId, owner_id: ownerId },
      include: [{ model: PetType, as: 'type' }, { model: Visit, as: 'visits' }],
    });
    if (!pet) throw new NotFoundError('Pet', petId);
    res.json(pet);
  }),
);

/* POST /api/owners/:ownerId/pets ------------------------------------------- */
router.post(
  '/:ownerId/pets',
  asyncHandler(async (req, res) => {
    const ownerId = parseIntParam(req.params.ownerId, 'ownerId');
    const owner = await Owner.findByPk(ownerId);
    if (!owner) throw new NotFoundError('Owner', ownerId);
    if (!isAdmin(req) && owner.username !== req.user!.username) {
      throw new ForbiddenError('You can only add pets to your own profile');
    }
    const pet = await Pet.create({ ...req.body, owner_id: ownerId });
    res.status(201).json(pet);
  }),
);

/* PUT /api/owners/:ownerId/pets/:petId ------------------------------------- */
router.put(
  '/:ownerId/pets/:petId',
  asyncHandler(async (req, res) => {
    const ownerId = parseIntParam(req.params.ownerId, 'ownerId');
    const petId = parseIntParam(req.params.petId, 'petId');
    if (!isAdmin(req)) {
      const owner = await Owner.findByPk(ownerId);
      if (!owner || owner.username !== req.user!.username) {
        throw new ForbiddenError('You can only edit your own pets');
      }
    }
    const pet = await Pet.findOne({ where: { id: petId, owner_id: ownerId } });
    if (!pet) throw new NotFoundError('Pet', petId);
    await pet.update(req.body);
    res.json(pet);
  }),
);

/* GET /api/owners/:ownerId/pets/:petId/visits ----------------------------- */
router.get(
  '/:ownerId/pets/:petId/visits',
  asyncHandler(async (req, res) => {
    const ownerId = parseIntParam(req.params.ownerId, 'ownerId');
    const petId = parseIntParam(req.params.petId, 'petId');
    if (!isAdmin(req)) {
      const owner = await Owner.findByPk(ownerId);
      if (!owner || owner.username !== req.user!.username) {
        throw new ForbiddenError('You can only view your own visits');
      }
    }
    const pet = await Pet.findOne({ where: { id: petId, owner_id: ownerId } });
    if (!pet) throw new NotFoundError('Pet', petId);
    const visits = await Visit.findAll({ where: { pet_id: petId } });
    res.json(visits);
  }),
);

/* POST /api/owners/:ownerId/pets/:petId/visits ----------------------------- */
router.post(
  '/:ownerId/pets/:petId/visits',
  asyncHandler(async (req, res) => {
    const ownerId = parseIntParam(req.params.ownerId, 'ownerId');
    const petId = parseIntParam(req.params.petId, 'petId');
    if (!isAdmin(req)) {
      const owner = await Owner.findByPk(ownerId);
      if (!owner || owner.username !== req.user!.username) {
        throw new ForbiddenError('You can only add visits to your own pets');
      }
    }
    const pet = await Pet.findOne({ where: { id: petId, owner_id: ownerId } });
    if (!pet) throw new NotFoundError('Pet', petId);
    const visit = await Visit.create({ ...req.body, pet_id: petId });
    res.status(201).json(visit);
  }),
);

export default router;
