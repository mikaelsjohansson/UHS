export type UserRole = 'USER' | 'ADMIN';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  passwordSet: boolean;
  isDefaultAdmin: boolean;
  createdAt: string;
}

export interface LoginResponseDto {
  token: string;
  user: UserDto;
  expiresAt: string;
}

export interface CreateUserRequestDto {
  username: string;
  email: string;
  role: UserRole;
}

export interface CreateUserResponseDto {
  user: UserDto;
  setupUrl: string;
}

export interface UpdateUserRequestDto {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface TokenValidationResponseDto {
  valid: boolean;
  username: string;
  expiresAt: string;
}

export interface SetupStatusDto {
  setupRequired: boolean;
}

export interface AuthState {
  currentUser: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
