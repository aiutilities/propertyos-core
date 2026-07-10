export interface Person {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
}

export type PersonResponse = Person;

export type PersonListResponse = Person[];
