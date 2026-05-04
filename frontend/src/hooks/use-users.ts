
import { useState, useCallback, useEffect } from 'react';
import { getUsers, getUser } from '@/lib/api';
import type { User } from '@/lib/types';

interface UseUsersReturn {
  users: User[];
  selectedUser: User | null;
  selectedUserId: number | null;
  isLoading: boolean;
  error: string | null;

  selectUser: (userId: number | null) => void;
  loadUsers: (role?: string) => Promise<void>;
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (role?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userList = await getUsers(role);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    loadUsers();
  }, [loadUsers]);


  useEffect(() => {
    if (selectedUserId === null) {
      setSelectedUser(null);
      return;
    }

    const loadSelectedUser = async () => {
      try {
        const user = await getUser(selectedUserId);
        setSelectedUser(user);
      } catch (err) {
        console.error('Failed to load user:', err);

        const found = users.find(u => u.user_id === selectedUserId);
        setSelectedUser(found || null);
      }
    };

    loadSelectedUser();
  }, [selectedUserId, users]);

  const selectUser = useCallback((userId: number | null) => {
    setSelectedUserId(userId);
  }, []);

  return {
    users,
    selectedUser,
    selectedUserId,
    isLoading,
    error,
    selectUser,
    loadUsers,
  };
}
