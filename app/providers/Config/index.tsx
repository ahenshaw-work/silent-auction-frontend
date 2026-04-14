'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

type RuntimeConfig = {
  KEYCLOAK_URL?: string;
  KEYCLOAK_REALM?: string;
  KEYCLOAK_CLIENT_ID?: string;
  BID_INCREMENT?: string;
  ADMIN_GROUP_NAME?: string;
};

const ConfigContext = createContext<RuntimeConfig>({});

export default function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<RuntimeConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/frontend/config')
      .then(response => {
        console.debug('Runtime config received:', response.data);
        setConfig(response.data);
      })
      .catch(error => {
        console.error('Failed to fetch runtime config:', error);
        setConfig({});
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
