'use client'
import axios from 'axios';
import { useMemo } from 'react';
import type { RefObject } from 'react';

/**
 * Returns an Axios instance that sends requests to the same origin.
 * All /api/v1/* calls are transparently proxied server-side to BACKEND_URL,
 * so that URL never needs to reach the browser.
 *
 * A single request interceptor is registered at instance creation time. It
 * reads the latest token from `tokenRef.current` synchronously at request
 * time, so a refreshed token is always used even if React state hasn't
 * re-rendered yet.
 */
export function useApiClient(tokenRef: RefObject<string | null>) {
  const apiClient = useMemo(() => {
    const instance = axios.create();
    instance.interceptors.request.use((config) => {
      const token = tokenRef.current;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return instance;
    // tokenRef is a stable ref object — intentionally omitted from deps
  }, []);

  return { apiClient, isConfigured: true as const };
}
