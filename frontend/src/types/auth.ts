export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUser = {
  id?: string;
  email: string;
  name?: string;
  roles?: string[];
};

export type LoginResponse = {
  accessToken?: string;
  token?: string;
  user?: AuthUser;
};
