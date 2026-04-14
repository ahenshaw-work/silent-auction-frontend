export type UserDTO = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  table_number: number;
};

export type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  tableNumber: number;
};

export type CreateMeRequest = {
  table_number: number;
};
