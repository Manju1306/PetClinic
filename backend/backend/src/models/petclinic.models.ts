/**
 * Sequelize models for the Spring PetClinic schema.
 *
 * One file with all entities for easy drop-in; split into per-file modules
 * if your project prefers that. Uses Sequelize 6 `InferAttributes` /
 * `InferCreationAttributes` for strict typing without separate interfaces.
 *
 * Usage:
 *   import { Sequelize } from 'sequelize';
 *   import { initModels, Owner, Pet } from './models/petclinic';
 *
 *   const sequelize = new Sequelize(...);
 *   initModels(sequelize);
 *
 *   const owners = await Owner.findAll({ include: [{ model: Pet, as: 'pets' }] });
 */
import {
  Sequelize,
  DataTypes,
  Model,
  Association,
  CreationOptional,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

/* -------------------------------------------------------------------------- */
/* Vet                                                                        */
/* -------------------------------------------------------------------------- */
export class Vet extends Model<InferAttributes<Vet>, InferCreationAttributes<Vet>> {
  declare id: CreationOptional<number>;
  declare first_name: string | null;
  declare last_name: string | null;

  declare specialties?: NonAttribute<Specialty[]>;

  declare static associations: {
    specialties: Association<Vet, Specialty>;
  };
}

/* -------------------------------------------------------------------------- */
/* Specialty                                                                  */
/* -------------------------------------------------------------------------- */
export class Specialty extends Model<
  InferAttributes<Specialty>,
  InferCreationAttributes<Specialty>
> {
  declare id: CreationOptional<number>;
  declare name: string | null;

  declare vets?: NonAttribute<Vet[]>;
}

/* -------------------------------------------------------------------------- */
/* VetSpecialty (join table)                                                  */
/* -------------------------------------------------------------------------- */
export class VetSpecialty extends Model<
  InferAttributes<VetSpecialty>,
  InferCreationAttributes<VetSpecialty>
> {
  declare vet_id: ForeignKey<Vet['id']>;
  declare specialty_id: ForeignKey<Specialty['id']>;
}

/* -------------------------------------------------------------------------- */
/* PetType (HSQLDB table name: `types`)                                       */
/* -------------------------------------------------------------------------- */
// Renamed from `Type` to `PetType` to avoid shadowing the TS `Type` identifier.
export class PetType extends Model<
  InferAttributes<PetType>,
  InferCreationAttributes<PetType>
> {
  declare id: CreationOptional<number>;
  declare name: string | null;
}

/* -------------------------------------------------------------------------- */
/* Owner                                                                      */
/* -------------------------------------------------------------------------- */
export class Owner extends Model<InferAttributes<Owner>, InferCreationAttributes<Owner>> {
  declare id: CreationOptional<number>;
  declare first_name: string | null;
  declare last_name: string | null;
  declare address: string | null;
  declare city: string | null;
  declare telephone: string | null;
  declare username: string | null;

  declare pets?: NonAttribute<Pet[]>;

  declare static associations: {
    pets: Association<Owner, Pet>;
  };
}

/* -------------------------------------------------------------------------- */
/* Pet                                                                        */
/* -------------------------------------------------------------------------- */
export class Pet extends Model<InferAttributes<Pet>, InferCreationAttributes<Pet>> {
  declare id: CreationOptional<number>;
  declare name: string | null;
  declare birth_date: Date | string | null;
  declare type_id: ForeignKey<PetType['id']>;
  declare owner_id: ForeignKey<Owner['id']>;

  declare owner?: NonAttribute<Owner>;
  declare type?: NonAttribute<PetType>;
  declare visits?: NonAttribute<Visit[]>;

  declare static associations: {
    owner: Association<Pet, Owner>;
    type: Association<Pet, PetType>;
    visits: Association<Pet, Visit>;
  };
}

/* -------------------------------------------------------------------------- */
/* Visit                                                                      */
/* -------------------------------------------------------------------------- */
export class Visit extends Model<InferAttributes<Visit>, InferCreationAttributes<Visit>> {
  declare id: CreationOptional<number>;
  declare pet_id: ForeignKey<Pet['id']>;
  declare visit_date: Date | string | null;
  declare description: string | null;

  declare pet?: NonAttribute<Pet>;
}

/* -------------------------------------------------------------------------- */
/* User                                                                       */
/* -------------------------------------------------------------------------- */
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare username: string; // natural primary key
  declare password: string;
  declare email: string | null;
  declare enabled: CreationOptional<boolean>;

  declare roles?: NonAttribute<Role[]>;

  declare static associations: {
    roles: Association<User, Role>;
  };
}

/* -------------------------------------------------------------------------- */
/* RefreshToken                                                               */
/* -------------------------------------------------------------------------- */
export class RefreshToken extends Model<
  InferAttributes<RefreshToken>,
  InferCreationAttributes<RefreshToken>
> {
  declare id: CreationOptional<number>;
  declare username: ForeignKey<User['username']>;
  declare token_hash: string;
  declare expires_at: Date;
  declare revoked_at: CreationOptional<Date | null>;
  declare replaced_by: CreationOptional<number | null>;
  declare created_at: CreationOptional<Date>;
}

/* -------------------------------------------------------------------------- */
/* PasswordResetToken                                                         */
/* -------------------------------------------------------------------------- */
export class PasswordResetToken extends Model<
  InferAttributes<PasswordResetToken>,
  InferCreationAttributes<PasswordResetToken>
> {
  declare id: CreationOptional<number>;
  declare username: ForeignKey<User['username']>;
  declare token_hash: string;
  declare expires_at: Date;
  declare used_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
}

/* -------------------------------------------------------------------------- */
/* Role                                                                       */
/* -------------------------------------------------------------------------- */
export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: CreationOptional<number>;
  declare username: ForeignKey<User['username']>;
  declare role: string;

  declare user?: NonAttribute<User>;
}

/* -------------------------------------------------------------------------- */
/* Init                                                                       */
/* -------------------------------------------------------------------------- */
/**
 * Initializes every model against the given Sequelize instance and wires up
 * associations. Call this once at application startup, after creating the
 * Sequelize instance and before issuing any queries.
 */
export function initModels(sequelize: Sequelize): void {
  Vet.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      first_name: { type: DataTypes.STRING(30), allowNull: true },
      last_name:  { type: DataTypes.STRING(30), allowNull: true },
    },
    {
      sequelize,
      tableName: 'vets',
      modelName: 'Vet',
      timestamps: false,
      indexes: [{ name: 'vets_last_name', fields: ['last_name'] }],
    },
  );

  Specialty.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: DataTypes.STRING(80), allowNull: true },
    },
    {
      sequelize,
      tableName: 'specialties',
      modelName: 'Specialty',
      timestamps: false,
      indexes: [{ name: 'specialties_name', fields: ['name'] }],
    },
  );

  VetSpecialty.init(
    {
      vet_id:       { type: DataTypes.INTEGER, allowNull: false },
      specialty_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      tableName: 'vet_specialties',
      modelName: 'VetSpecialty',
      timestamps: false,
    },
  );

  PetType.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: DataTypes.STRING(80), allowNull: true },
    },
    {
      sequelize,
      tableName: 'types',
      modelName: 'PetType',
      timestamps: false,
      indexes: [{ name: 'types_name', fields: ['name'] }],
    },
  );

  Owner.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      first_name: { type: DataTypes.STRING(30),  allowNull: true },
      last_name:  { type: DataTypes.STRING(30),  allowNull: true },
      address:    { type: DataTypes.STRING(255), allowNull: true },
      city:       { type: DataTypes.STRING(80),  allowNull: true },
      telephone:  { type: DataTypes.STRING(20),  allowNull: true },
      username:   { type: DataTypes.STRING(20),  allowNull: true },
    },
    {
      sequelize,
      tableName: 'owners',
      modelName: 'Owner',
      timestamps: false,
      indexes: [
        { name: 'owners_last_name', fields: ['last_name'] },
        { name: 'owners_username', fields: ['username'], unique: true },
      ],
    },
  );

  Pet.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name:       { type: DataTypes.STRING(30), allowNull: true },
      birth_date: { type: DataTypes.DATEONLY,   allowNull: true },
      type_id:    { type: DataTypes.INTEGER,    allowNull: false },
      owner_id:   { type: DataTypes.INTEGER,    allowNull: false },
    },
    {
      sequelize,
      tableName: 'pets',
      modelName: 'Pet',
      timestamps: false,
      indexes: [{ name: 'pets_name', fields: ['name'] }],
    },
  );

  Visit.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      pet_id:      { type: DataTypes.INTEGER,    allowNull: false },
      visit_date:  { type: DataTypes.DATEONLY,   allowNull: true, defaultValue: DataTypes.NOW },
      description: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      sequelize,
      tableName: 'visits',
      modelName: 'Visit',
      timestamps: false,
      indexes: [{ name: 'visits_pet_id', fields: ['pet_id'] }],
    },
  );

  User.init(
    {
      username: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
      },
      password: { type: DataTypes.STRING(60), allowNull: false },
      email: {
        type: DataTypes.STRING(120),
        allowNull: true,
        unique: true,
        validate: { isEmail: true },
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'users',
      modelName: 'User',
      timestamps: false,
    },
  );

  RefreshToken.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      username:    { type: DataTypes.STRING(20),  allowNull: false },
      token_hash:  { type: DataTypes.STRING(64),  allowNull: false, unique: true },
      expires_at:  { type: DataTypes.DATE,        allowNull: false },
      revoked_at:  { type: DataTypes.DATE,        allowNull: true,  defaultValue: null },
      replaced_by: { type: DataTypes.INTEGER,     allowNull: true,  defaultValue: null },
      created_at:  { type: DataTypes.DATE,        allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: 'refresh_tokens',
      modelName: 'RefreshToken',
      timestamps: false,
      indexes: [
        { name: 'refresh_tokens_username', fields: ['username'] },
      ],
    },
  );

  PasswordResetToken.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      username:   { type: DataTypes.STRING(20), allowNull: false },
      token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE,       allowNull: false },
      used_at:    { type: DataTypes.DATE,       allowNull: true,  defaultValue: null },
      created_at: { type: DataTypes.DATE,       allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: 'password_reset_tokens',
      modelName: 'PasswordResetToken',
      timestamps: false,
      indexes: [
        { name: 'password_reset_tokens_username', fields: ['username'] },
      ],
    },
  );

  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      username: { type: DataTypes.STRING(20), allowNull: false },
      role:     { type: DataTypes.STRING(20), allowNull: false },
    },
    {
      sequelize,
      tableName: 'roles',
      modelName: 'Role',
      timestamps: false,
      indexes: [{ name: 'fk_username_idx', fields: ['username'] }],
    },
  );

  /* -------------------- associations ------------------------------------ */

  // vets <-> specialties (many-to-many through vet_specialties)
  Vet.belongsToMany(Specialty, {
    through: VetSpecialty,
    foreignKey: 'vet_id',
    otherKey: 'specialty_id',
    as: 'specialties',
    timestamps: false,
  });
  Specialty.belongsToMany(Vet, {
    through: VetSpecialty,
    foreignKey: 'specialty_id',
    otherKey: 'vet_id',
    as: 'vets',
    timestamps: false,
  });

  // owners 1—N pets
  Owner.hasMany(Pet, { foreignKey: 'owner_id', as: 'pets' });
  Pet.belongsTo(Owner, { foreignKey: 'owner_id', as: 'owner' });

  // types 1—N pets
  PetType.hasMany(Pet, { foreignKey: 'type_id', as: 'pets' });
  Pet.belongsTo(PetType, { foreignKey: 'type_id', as: 'type' });

  // pets 1—N visits
  Pet.hasMany(Visit, { foreignKey: 'pet_id', as: 'visits' });
  Visit.belongsTo(Pet, { foreignKey: 'pet_id', as: 'pet' });

  // users 1—1 owners (optional link)
  User.hasOne(Owner, { foreignKey: 'username', sourceKey: 'username', as: 'owner' });
  Owner.belongsTo(User, { foreignKey: 'username', targetKey: 'username', as: 'user' });

  // users 1—N roles (FK on the natural `username` key)
  User.hasMany(Role, {
    foreignKey: 'username',
    sourceKey: 'username',
    as: 'roles',
  });
  Role.belongsTo(User, {
    foreignKey: 'username',
    targetKey: 'username',
    as: 'user',
  });

  // users 1—N refresh_tokens / password_reset_tokens (also FK on `username`)
  User.hasMany(RefreshToken, { foreignKey: 'username', sourceKey: 'username', as: 'refresh_tokens' });
  RefreshToken.belongsTo(User, { foreignKey: 'username', targetKey: 'username', as: 'user' });

  User.hasMany(PasswordResetToken, { foreignKey: 'username', sourceKey: 'username', as: 'password_reset_tokens' });
  PasswordResetToken.belongsTo(User, { foreignKey: 'username', targetKey: 'username', as: 'user' });
}