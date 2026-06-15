import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Role, RefreshToken, PasswordResetToken, Owner, sequelize } from '../db';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware';
import { requireRole } from '../auth/middleware';

const router = Router();

interface RoleInput { name?: string }
interface CreateUserBody {
  username?: string;
  password?: string;
  enabled?: boolean;
  roles?: Array<RoleInput | string>;
}

/* GET /api/users (admin only) ---------------------------------------------- */
router.get(
  '/',
  requireRole('ROLE_ADMIN'),
  asyncHandler(async (_req, res) => {
    const users = await User.findAll({
      include: [{ model: Role, as: 'roles' }],
      attributes: { exclude: ['password'] },
      order: [['username', 'ASC']],
    });
    res.json(users);
  }),
);

/* POST /api/users ---------------------------------------------------------- */
router.post(
  '/',
  requireRole('ROLE_ADMIN'),
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as CreateUserBody;
    const { username, password, enabled = true, roles = [] } = body;

    if (!username || typeof username !== 'string') throw new BadRequestError('username is required');
    if (!password || typeof password !== 'string') throw new BadRequestError('password is required');
    if (!Array.isArray(roles)) throw new BadRequestError('roles must be an array');

    const roleNames = roles.map(r => {
      if (typeof r === 'string') return r;
      if (r && typeof r === 'object' && typeof r.name === 'string') return r.name;
      throw new BadRequestError('Each role must be a string or { name: string }');
    });

    const hashed = await bcrypt.hash(password, 10);

    const result = await sequelize.transaction(async tx => {
      const user = await User.create({ username, password: hashed, enabled }, { transaction: tx });
      if (roleNames.length > 0) {
        await Role.bulkCreate(
          roleNames.map(role => ({ username: user.username, role })),
          { transaction: tx },
        );
      }
      return user;
    });

    const created = await User.findByPk(result.username, {
      include: [{ model: Role, as: 'roles' }],
      attributes: { exclude: ['password'] },
    });
    res.status(201).json(created);
  }),
);

/* DELETE /api/users/:username (admin only) --------------------------------- */
router.delete(
  '/:username',
  requireRole('ROLE_ADMIN'),
  asyncHandler(async (req, res) => {
    const username = (req as any).params.username as string;
    if (!username) throw new BadRequestError('username is required');

    const user = await User.findByPk(username);
    if (!user) throw new NotFoundError('User', username as any);

    await sequelize.transaction(async tx => {
      await Owner.update({ username: null }, { where: { username }, transaction: tx });
      await PasswordResetToken.destroy({ where: { username }, transaction: tx });
      await RefreshToken.destroy({ where: { username }, transaction: tx });
      await Role.destroy({ where: { username }, transaction: tx });
      await User.destroy({ where: { username }, transaction: tx });
    });

    res.status(204).send();
  }),
);

export default router;
