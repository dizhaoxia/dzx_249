import request from './request';
import { LoginRequest, RegisterRequest, LoginResponse, User } from '../types';

export function register(data: RegisterRequest) {
  return request.post<any, LoginResponse>('/auth/register', data);
}

export function login(data: LoginRequest) {
  return request.post<any, LoginResponse>('/auth/login', data);
}

export function getCurrentUser() {
  return request.get<any, { user: User }>('/auth/me');
}
