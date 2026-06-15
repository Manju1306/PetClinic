// ------------------------------------ UTIL --------------------------------------
export type IHttpMethod = 'POST' | 'PUT' | 'GET';


// ------------------------------------ ERROR ------------------------------------
export interface IFieldError {
  field: string;
  message: string;
}

interface IFieldErrors {
  [index: string]: IFieldError;
}

export interface IError {
  fieldErrors: IFieldErrors;
}


// ------------------------------------ FORM --------------------------------------
export interface IConstraint {
  message: string;
  validate: (value: any) => boolean;
}

export type IInputChangeHandler = (name: string, value: string, error: IFieldError | null) => void;

export interface ISelectOption {
  value: string | number;
  name: string;
}

// ------------------------------------ MODEL .------------------------------------

interface IBaseEntity {
  id: number | null;
  isNew: boolean;
}

interface INamedEntity extends IBaseEntity {
  name: string;
}

interface IPerson extends IBaseEntity {
  first_name: string;
  last_name: string;
}

export interface IVisit extends IBaseEntity {
  visit_date: Date | string | null;
  description: string;
}

export interface IPetType extends INamedEntity {
}

export type IPetTypeId = number;

export interface IPet extends INamedEntity {
  birth_date: Date | string;
  type: IPetType;
  visits: IVisit[];
}

export interface IEditablePet extends INamedEntity {
  birth_date?: string | null;
  typeId?: IPetTypeId | null;
}

export interface IPetRequest {
  name: string;
  birth_date?: string | null;
  typeId: IPetTypeId | null | undefined;
}

export interface IOwner extends IPerson {
  address: string;
  city: string;
  telephone: string;
  pets: IPet[];
}

export interface ISpecialty extends INamedEntity {
}

export interface IVet extends IPerson {
  specialties: ISpecialty[];
}

// ------------------------------------ AUTH --------------------------------------

export interface IAuthUser {
  username: string;
  email: string | null;
  roles: string[];
  owner_id: number | null;
}

export interface IAuthCredentials {
  username: string;
  password: string;
}

export interface IAuthResponse {
  access_token: string;
  refresh_token: string;
  user: IAuthUser;
}

export interface IRefreshResponse {
  access_token: string;
  refresh_token?: string;
}
