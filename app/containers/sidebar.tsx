'use client'

import {
  Content,
  ContentVariants,
  Nav,
  NavItem,
  NavList,
  PageSidebar,
  PageSidebarBody,
} from '@patternfly/react-core';
import { useAuth } from '@app/providers/Auth';
import { useConfig } from '@app/providers/Config';
import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'

type AppSidebarProps = {
  isSidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function AppSideBar({
    isSidebarOpen,
    setSidebarOpen
  }: AppSidebarProps) {

  const { user } = useAuth();
  const config = useConfig();
  const pathname = usePathname();
  const onSidebarToggle = useCallback(() => {
    setSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen, setSidebarOpen]);

  return (
    <PageSidebar id="nav-sidebar" isSidebarOpen={isSidebarOpen}>
      <PageSidebarBody>
        <Nav>
          <NavList>
            <NavItem
              id="nav-sidebar-link-home"
              itemID="home"
              isActive={pathname === '/'}
              onClick={onSidebarToggle}
            >
              <Link href="/"><Content component={ContentVariants.p}>Home</Content></Link>
            </NavItem>
            <NavItem
              id="nav-sidebar-link-auctions"
              itemID="auctions"
              isActive={pathname.startsWith('/auctions')}
              onClick={onSidebarToggle}
            >
              <Link href="/auctions"><Content component={ContentVariants.p}>Auctions</Content></Link>
            </NavItem>
            {user?.groups?.includes(config.ADMIN_GROUP_NAME ? config.ADMIN_GROUP_NAME : 'admin') ? (
              <>
                <NavItem
                  id="nav-sidebar-link-highest-bids"
                  itemID="highest-bids"
                  isActive={pathname.startsWith('/highest-bids')}
                  onClick={onSidebarToggle}
                >
                  <Link href="/highest-bids"><Content component={ContentVariants.p}>Highest Bids</Content></Link>
                </NavItem>
                <NavItem
                  id="nav-sidebar-link-users"
                  itemID="users"
                  isActive={pathname.startsWith('/users')}
                  onClick={onSidebarToggle}
                >
                  <Link href="/users"><Content component={ContentVariants.p}>Users</Content></Link>
                </NavItem>
              </>
            ) : null}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
