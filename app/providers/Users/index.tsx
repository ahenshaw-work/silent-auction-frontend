'use client'
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useApiClient } from '@app/components/ApiClient';
import { useAuth } from '@app/providers/Auth';
import { useConfig } from '@app/providers/Config';
import { User, UserDTO } from '@app/types';

interface UsersContextType {
  users: User[];
  getUserDetails: (userId: string) => Promise<User | undefined>;
  loading: boolean;
  error: Error | null;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within an UsersProvider');
  }
  return context;
}

interface UsersProviderProps {
  children: ReactNode;
}

export function UsersProvider({ children }: UsersProviderProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { token, user } = useAuth();
  // Keep token in a ref so the Axios interceptor always reads the latest value
  // at request time, avoiding stale-closure issues from React state.
  const tokenRef = useRef<string | null>(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const { apiClient, isConfigured } = useApiClient(tokenRef);
  const config = useConfig();

  const mapUser = ({
    id,
    username,
    first_name,
    last_name,
    table_number,
  }: UserDTO): User => ({
    id: id.toString(),
    username,
    firstName: first_name,
    lastName: last_name,
    tableNumber: table_number,
  });

  async function getUserDetails(userId: string): Promise<User | undefined> {
    if (!tokenRef.current) throw new Error('Authentication required');
    if (!isConfigured) throw new Error('[UsersProvider] API client not configured yet');

    if (user?.groups?.includes(config.ADMIN_GROUP_NAME ? config.ADMIN_GROUP_NAME : 'admin')) {
      try {
        const response = await apiClient.get(`/api/v1/users/${userId}`);
        return mapUser(response.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user details'));
        throw err;
      }
    } else {
      return undefined;
    }
  }

  // Fetch all users
  useEffect(() => {
    let mounted = true;
    const getUsers = async () => {
      if (!token || !mounted || !isConfigured) {
        console.debug('[UsersProvider] API client not configured yet, skipping users fetch');
        return;
      }
      setLoading(true);
      if (user?.groups?.includes(config.ADMIN_GROUP_NAME ? config.ADMIN_GROUP_NAME : 'admin')) {
        try {
          const response = await apiClient.get('/api/v1/users');
          if (mounted) {
            const mappedUsers = response.data.map(mapUser);
            setUsers(mappedUsers);
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err : new Error('Failed to fetch users'));
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getUsers();

    return () => {
      mounted = false;
    };
  }, [token, isConfigured]);

  const value = {
    users,
    getUserDetails,
    loading,
    error
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
}

export default UsersProvider;
