'use client'

import {
  Avatar,
  Brand,
  Content,
  ContentVariants,
  Dropdown,
  DropdownList,
  DropdownItem,
  Masthead,
  MastheadLogo,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  MastheadBrand,
  MenuToggle,
  PageToggleButton,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import React, { MouseEvent as ReactMouseEvent, useCallback, useState } from 'react';
// import { useAsync } from 'react-use';
import { useAuth } from '@app/providers/Auth';
import { useConfig } from '@app/providers/Config';

import MoonIcon from '@patternfly/react-icons/dist/esm/icons/moon-icon';
import SunIcon from '@patternfly/react-icons/dist/esm/icons/sun-icon';

type AppMastheadProps = {
  isDarkThemeEnabled: boolean;
  setDarkThemeEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function AppMasthead(
  {
    isDarkThemeEnabled,
    setDarkThemeEnabled,
    isSidebarOpen,
    setSidebarOpen,
    // isNotificationDrawerOpen,
    // onCloseNotificationDrawer,
  }: AppMastheadProps,
) {

  const { user, logout } = useAuth();
  const config = useConfig();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const onDarkThemeToggleClick = () => {
    setDarkThemeEnabled(!isDarkThemeEnabled);
  }

  const onSidebarToggle = useCallback(() => {
    setSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen, setSidebarOpen]);

  const [isFullKebabDropdownOpen, setIsFullKebabDropdownOpen] = useState(false);

  const onFullKebabToggle = useCallback(() => {
    setIsFullKebabDropdownOpen(!isFullKebabDropdownOpen);
  }, [isFullKebabDropdownOpen, setIsFullKebabDropdownOpen]);

  const onFullKebabSelect = useCallback(() => {
    setIsFullKebabDropdownOpen(false);
  }, [setIsFullKebabDropdownOpen]);

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const onUserDropdownToggle = useCallback(() => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  }, [isUserDropdownOpen, setIsUserDropdownOpen]);

  const onUserDropdownSelect = useCallback(() => {
    setIsUserDropdownOpen(false);
  }, [setIsUserDropdownOpen]);

  const onClickLogout = useCallback(
    (event: ReactMouseEvent<Element, MouseEvent>) => {
      event.preventDefault();
      logout();
    },
    [logout],
  );

  // const { value: avatarUrl = avatarImgSrc as string } =
  //   useAsync(async (): Promise<string | undefined> => {
  //     if (!user?.email) {
  //       return undefined;
  //     }
  //
  //     const hash = Array.from(
  //       new Uint8Array(
  //         await crypto.subtle.digest(
  //           'SHA-256',
  //           new TextEncoder().encode(user.email),
  //         ),
  //       ),
  //     )
  //       .map(byte => byte.toString(16).padStart(2, '0'))
  //       .join('');
  //
  //     return `https://gravatar.com/avatar/${hash}?s=32&d=identicon`;
  //   }, [user?.email]);

  const userDropdownItems = [
    <DropdownItem
      key="account"
      // Ensure PatternFly styling is inherited
      component={(props) =>
        <Content
          {...props}
          component={ContentVariants.a}
          href={`${config.KEYCLOAK_URL}/realms/${config.KEYCLOAK_REALM}/account/#/`}
          target="_blank"
          noreferrer="true"
          noopen="true"
          alt={"Access and manage your account. This is an external link."}
        >
          Account
        </Content>
      }
    >
    </DropdownItem>,
    <DropdownItem key="logout" onClick={onClickLogout}>
      <Content component={ContentVariants.p}>Logout</Content>
    </DropdownItem>,
  ];

  return (
    <Masthead>
      
      <MastheadMain><MastheadToggle>
        <PageToggleButton
          id="nav-sidebar-toggle"
          variant="plain"
          aria-label={'Global navigation'}
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={onSidebarToggle}
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
        <MastheadBrand data-codemods><MastheadLogo data-codemods>
          <Brand
            src={'/logo.svg'}
            alt={'SILENT AUCTION'}
            widths={{ default: '200px' }}
            heights={{ default: '50px' }}
          />
        </MastheadLogo></MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup
              align={{ default: 'alignEnd' }}
              gap={{ default: 'gapNone', md: 'gapMd' }}
            >
              <ToolbarItem>
                <ToggleGroup aria-label="Dark theme toggle">
                  <ToggleGroupItem
                    icon={<SunIcon style={!isDarkThemeEnabled ? {filter: "invert(1)"} : {filter: "invert(0)"}} />}
                    aria-label={"Light Theme"}
                    buttonId={"toggle-group-light-theme"}
                    isSelected={!isDarkThemeEnabled}
                    onClick={onDarkThemeToggleClick}
                  />
                  <ToggleGroupItem
                    icon={<MoonIcon style={isDarkThemeEnabled ? {filter: "invert(1)"} : {filter: "invert(0)"}} />}
                    aria-label={"Dark Theme"}
                    buttonId={"toggle-group-dark-theme"}
                    isSelected={isDarkThemeEnabled}
                    onClick={onDarkThemeToggleClick}
                  />
                </ToggleGroup>
              </ToolbarItem>
              <ToolbarItem visibility={{ md: 'hidden' }}>
                <Dropdown
                  isOpen={isFullKebabDropdownOpen}
                  onSelect={onFullKebabSelect}
                  onOpenChange={setIsFullKebabDropdownOpen}
                  popperProps={{ position: 'right' }}
                  toggle={(toggleRef: React.RefObject<HTMLButtonElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      isExpanded={isFullKebabDropdownOpen}
                      onClick={onFullKebabToggle}
                      variant="plain"
                      aria-label={'Toolbar menu'}
                    >
                      <EllipsisVIcon aria-hidden="true" />
                    </MenuToggle>
                  )}
                >
                  <DropdownList>{userDropdownItems}</DropdownList>
                </Dropdown>
              </ToolbarItem>
              <ToolbarItem visibility={{ default: 'hidden', md: 'visible' }}>
                <Dropdown
                  isOpen={isUserDropdownOpen}
                  onSelect={onUserDropdownSelect}
                  onOpenChange={setIsUserDropdownOpen}
                  popperProps={{ position: 'right' }}
                  toggle={(toggleRef: React.RefObject<HTMLButtonElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      isExpanded={isUserDropdownOpen}
                      onClick={onUserDropdownToggle}
                      icon={
                        <Avatar
                          src={'/avatarImg.svg'}
                          alt={`${user?.email}'s avatar image`}
                          className={"pf-v6-c-avatar pf-m-sm"}
                          style={{verticalAlign: "bottom"}}
                          onError={(e) => {
                            setAvatarLoadFailed(true);
                            e.currentTarget.src = '/avatarImg.svg';
                          }}
                          isBordered
                        />
                      }
                      isFullHeight
                    >
                      {user ? (
                        `${user?.given_name} ${user?.family_name}`
                      ) : (
                        <Content component={ContentVariants.p}>Guest</Content>
                      )}
                    </MenuToggle>
                  )}
                >
                  <DropdownList>{userDropdownItems}</DropdownList>
                </Dropdown>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );
};
