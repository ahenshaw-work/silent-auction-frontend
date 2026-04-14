'use client'

import React, { useState, useEffect } from 'react';
import AuthProvider from '@app/providers/Auth';
import AuctionProvider from '@app/providers/Auctions';
import ConfigProvider from '@app/providers/Config';
import UsersProvider from '@app/providers/Users';
import AppMasthead from '@app/containers/masthead';
import AppSidebar from '@app/containers/sidebar';
import { Page } from '@patternfly/react-core';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [isDarkThemeEnabled, setDarkThemeEnabled] = useState(false);
  const [themeInitialized, setThemeInitialized] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored !== null) {
      setDarkThemeEnabled(stored === 'dark');
    } else {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkThemeEnabled(typeof mql.matches === 'boolean' ? mql.matches : false);
    }
    setThemeInitialized(true);
  }, []);

  useEffect(() => {
    if (!themeInitialized) return;
    document.documentElement.className = isDarkThemeEnabled ? 'pf-v6-theme-dark' : '';
    localStorage.setItem('theme', isDarkThemeEnabled ? 'dark' : 'light');
  }, [isDarkThemeEnabled, themeInitialized]);

  return (
    <ConfigProvider>
      <AuthProvider>
        <UsersProvider>
          <AuctionProvider>
            <Page
              masthead={
                <AppMasthead
                  isDarkThemeEnabled={isDarkThemeEnabled}
                  setDarkThemeEnabled={setDarkThemeEnabled}
                  isSidebarOpen={isSidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              }
              sidebar={
                <AppSidebar
                  isSidebarOpen={isSidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            >
              {children}
            </Page>
          </AuctionProvider>
        </UsersProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
