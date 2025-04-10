// interfaccia per estrazione dati dalla request
export interface UserFromToken {
  id: number;
  key: string;
  email: string;
  username: string;
  name: string | null;
  surname: string | null;
  iat: number;
  exp: number;
}
