export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthPerson = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginResponse = {
  accessToken: string;
  person: AuthPerson;
};
