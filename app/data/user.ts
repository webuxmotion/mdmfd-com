export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  link?: string;
  createdAt: Date;
}

export interface AuthUser extends User {
  password?: string;
}
