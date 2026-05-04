import type { User } from '../types';
import { API_BASE, safeFetch, handleResponse } from './client';

export async function getUsers(role?: string, limit: number = 130): Promise<User[]> {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  params.append('limit', limit.toString());

  const response = await safeFetch(`${API_BASE}/api/v1/users/?${params}`);
  return handleResponse<User[]>(response);
}

export async function getUser(userId: number): Promise<User> {
  const response = await safeFetch(`${API_BASE}/api/v1/users/${userId}`);
  return handleResponse<User>(response);
}

export async function updateUserInterests(
  userId: number,
  interests: string[],
): Promise<User> {
  const response = await safeFetch(
    `${API_BASE}/api/v1/users/${userId}/interests`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests }),
    },
  );
  return handleResponse<User>(response);
}
