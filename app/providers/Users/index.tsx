'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useApiClient,  configureHeaders } from '@app/components/ApiClient';
import { useAuth } from '@app/providers/Auth';
import { useConfig } from '@app/providers/Config';
import { User, UserDTO } from '@app/types';

interface UsersContextType {
  users: User[];
  getUserDetails: (userId: string) => Promise<User | undefined>;
  loading: boolean;
  error: Error | null;
}

// Create the context with a default value
const UsersContext = createContext<UsersContextType | undefined>(undefined);

// Custom hook to use the auctions context
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
  const { apiClient, isConfigured } = useApiClient();
  const config = useConfig();

  const mapUser = ({
                        id,
                        username,
                        first_name,
                        last_name,
                        table_number,
                      }: UserDTO): { id: string; username: string, firstName: string; lastName: string; tableNumber: number } => {
    return {
      id: id.toString(),
      username: username,
      firstName: first_name,
      lastName: last_name,
      tableNumber: table_number,
    };
  };

  // const mapBid = ({
  //                   id,
  //                   auction_id,
  //                   user_id,
  //                   bid_time,
  //                   bid_amount,
  //                 }: BidDTO): Bid => ({
  //   id,
  //   auctionId: auction_id.toString(),
  //   userId: user_id.toString(),
  //   time: new Date(bid_time),
  //   amount: bid_amount,
  // });

  async function getUserDetails(userId: string): Promise<User | undefined> {
    if (!token) throw new Error('Authentication required');
    if (!isConfigured) throw new Error('[UsersProvider] API client not configured yet');

    if (user?.groups?.includes(config.ADMIN_GROUP_NAME ? config.ADMIN_GROUP_NAME:  'admin')) {
      try {
        configureHeaders(apiClient, token);
        const response = await apiClient.get(`/api/v1/users/${userId}`);
        return response.data.map(mapUser);
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
      if (!token || !mounted || !isConfigured ){
        console.debug('[UsersProvider] API client not configured yet, skipping users fetch');
        return;
      }
      setLoading(true);
      if (user?.groups?.includes(config.ADMIN_GROUP_NAME ? config.ADMIN_GROUP_NAME:  'admin')) {
        try {
          configureHeaders(apiClient, token);
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