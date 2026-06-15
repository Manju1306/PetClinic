-- PetClinic schema, SQLite-compatible.
--
-- Conversion notes vs the MySQL source:
--   * `INT(4) UNSIGNED` / `int(11)`     -> `INTEGER`. SQLite has no UNSIGNED and
--                                          ignores display widths; "INTEGER"
--                                          (exact spelling) on a single-column
--                                          PRIMARY KEY makes the column an
--                                          alias for ROWID with auto-increment
--                                          behavior, so no `AUTOINCREMENT`
--                                          keyword is needed or wanted.
--   * `VARCHAR(n)`                       -> kept as-is. SQLite stores them with
--                                          TEXT affinity and ignores the length;
--                                          retained for documentation only.
--   * `TINYINT NOT NULL DEFAULT 1`       -> `INTEGER NOT NULL DEFAULT 1`. SQLite
--                                          has no native boolean type; store 0/1.
--   * `ENGINE=InnoDB`                    -> dropped; SQLite has one storage layer.
--   * Inline `INDEX(col)` / `KEY ...`    -> moved to separate `CREATE INDEX`
--                                          statements; SQLite doesn't allow
--                                          inline index declarations.
--   * MySQL auto-indexes FK columns;
--     SQLite does NOT. Explicit indexes
--     added for every FK column to
--     preserve lookup performance.
--   * `PRAGMA foreign_keys = ON;` is
--     required per-connection because
--     SQLite parses FK clauses but does
--     NOT enforce them by default.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS vets (
  id         INTEGER PRIMARY KEY,
  first_name VARCHAR(30),
  last_name  VARCHAR(30)
);
CREATE INDEX IF NOT EXISTS vets_last_name ON vets (last_name);

CREATE TABLE IF NOT EXISTS specialties (
  id   INTEGER PRIMARY KEY,
  name VARCHAR(80)
);
CREATE INDEX IF NOT EXISTS specialties_name ON specialties (name);

CREATE TABLE IF NOT EXISTS vet_specialties (
  vet_id       INTEGER NOT NULL,
  specialty_id INTEGER NOT NULL,
  UNIQUE (vet_id, specialty_id),
  FOREIGN KEY (vet_id)       REFERENCES vets (id),
  FOREIGN KEY (specialty_id) REFERENCES specialties (id)
);
-- Backs up the FK for fast specialty -> vets joins (UNIQUE above already covers vet_id).
CREATE INDEX IF NOT EXISTS vet_specialties_specialty_id ON vet_specialties (specialty_id);

CREATE TABLE IF NOT EXISTS types (
  id   INTEGER PRIMARY KEY,
  name VARCHAR(80)
);
CREATE INDEX IF NOT EXISTS types_name ON types (name);

CREATE TABLE IF NOT EXISTS owners (
  id         INTEGER PRIMARY KEY,
  first_name VARCHAR(30),
  last_name  VARCHAR(30),
  address    VARCHAR(255),
  city       VARCHAR(80),
  telephone  VARCHAR(20),
  username   VARCHAR(20),
  FOREIGN KEY (username) REFERENCES users (username)
);
CREATE INDEX IF NOT EXISTS owners_last_name ON owners (last_name);
CREATE UNIQUE INDEX IF NOT EXISTS owners_username ON owners (username);

CREATE TABLE IF NOT EXISTS pets (
  id         INTEGER PRIMARY KEY,
  name       VARCHAR(30),
  birth_date DATE,
  type_id    INTEGER NOT NULL,
  owner_id   INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES owners (id),
  FOREIGN KEY (type_id)  REFERENCES types (id)
);
CREATE INDEX IF NOT EXISTS pets_name     ON pets (name);
CREATE INDEX IF NOT EXISTS pets_owner_id ON pets (owner_id);
CREATE INDEX IF NOT EXISTS pets_type_id  ON pets (type_id);

CREATE TABLE IF NOT EXISTS visits (
  id          INTEGER PRIMARY KEY,
  pet_id      INTEGER NOT NULL,
  visit_date  DATE,
  description VARCHAR(255),
  FOREIGN KEY (pet_id) REFERENCES pets (id)
);
CREATE INDEX IF NOT EXISTS visits_pet_id ON visits (pet_id);

CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(20)  NOT NULL,
  password VARCHAR(60)  NOT NULL,
  email    VARCHAR(120),
  enabled  INTEGER      NOT NULL DEFAULT 1,
  PRIMARY KEY (username)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email);

CREATE TABLE IF NOT EXISTS roles (
  id       INTEGER PRIMARY KEY,
  username VARCHAR(20) NOT NULL,
  role     VARCHAR(20) NOT NULL,
  CONSTRAINT fk_username FOREIGN KEY (username) REFERENCES users (username)
);
CREATE UNIQUE INDEX IF NOT EXISTS uni_username_role ON roles (role, username);
CREATE INDEX        IF NOT EXISTS fk_username_idx  ON roles (username);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INTEGER PRIMARY KEY,
  username    VARCHAR(20) NOT NULL,
  token_hash  VARCHAR(64) NOT NULL,
  expires_at  DATETIME    NOT NULL,
  revoked_at  DATETIME,
  replaced_by INTEGER,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username)    REFERENCES users (username),
  FOREIGN KEY (replaced_by) REFERENCES refresh_tokens (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX        IF NOT EXISTS refresh_tokens_username   ON refresh_tokens (username);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INTEGER PRIMARY KEY,
  username   VARCHAR(20) NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME    NOT NULL,
  used_at    DATETIME,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users (username)
);
CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX        IF NOT EXISTS password_reset_tokens_username   ON password_reset_tokens (username);