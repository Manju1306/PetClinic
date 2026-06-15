import { Sequelize } from 'sequelize';
import { initModels, RefreshToken, PasswordResetToken, User, Owner } from './models/petclinic.models';

/*
const databaseUrl = process.env.DATABASE_URL ?? 'postgres://petclinic:petclinic@localhost:5432/petclinic';
export const sequelize = new Sequelize(databaseUrl, {
  logging: process.env.SQL_LOG === 'true' ? console.log : false,
  define: { underscored: true, freezeTableName: true },
});
*/

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './petclinic.db',
});

initModels(sequelize);

/**
 * Creates the auth-related tables and the `users.email` column if they aren't
 * already present. Idempotent — safe to call on every startup. The base
 * PetClinic schema is still managed by `scripts/db/sqlite/schema.sql`; this
 * function only fills in what auth needs on top of an existing DB.
 */
export async function ensureAuthSchema(): Promise<void> {
  await RefreshToken.sync();
  await PasswordResetToken.sync();

  const qi = sequelize.getQueryInterface();
  const usersTable = User.getTableName() as string;
  const userColumns = await qi.describeTable(usersTable);
  if (!('email' in userColumns)) {
    // SQLite forbids `ALTER TABLE ADD COLUMN ... UNIQUE` — add the column first,
    // then enforce uniqueness via an index.
    await qi.addColumn(usersTable, 'email', { type: 'VARCHAR(120)', allowNull: true });
  }
  await qi.addIndex(usersTable, {
    name: 'users_email',
    fields: ['email'],
    unique: true,
  }).catch(() => undefined); // already exists -> swallow

  // Add username column to owners if missing (links owner to user account)
  const ownersTable = Owner.getTableName() as string;
  const ownerColumns = await qi.describeTable(ownersTable);
  if (!('username' in ownerColumns)) {
    await qi.addColumn(ownersTable, 'username', { type: 'VARCHAR(20)', allowNull: true });
  }
  await qi.addIndex(ownersTable, {
    name: 'owners_username',
    fields: ['username'],
    unique: true,
  }).catch(() => undefined);
}

export * from './models/petclinic.models';