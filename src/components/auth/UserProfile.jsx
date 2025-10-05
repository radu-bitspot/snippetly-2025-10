import React, { useState } from 'react';
import { Button, Card, Popover, Menu, MenuItem, Divider } from '@blueprintjs/core';
import { useAuth } from '../../context/AuthContext';

const UserProfile = () => {
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  const userMenu = (
    <Menu>
      <MenuItem
        icon="user"
        text="Profile"
        onClick={() => {
          // TODO: Implement profile management
          alert('Profile management coming soon!');
        }}
      />
      <MenuItem
        icon="cog"
        text="Settings"
        onClick={() => {
          // TODO: Implement settings
          alert('Settings coming soon!');
        }}
      />
      <Divider />
      <MenuItem
        icon="log-out"
        text={isLoggingOut ? "Signing out..." : "Sign out"}
        onClick={handleLogout}
        disabled={isLoggingOut}
      />
    </Menu>
  );

  return (
    <Popover
      content={userMenu}
      position="bottom-right"
      boundary="viewport"
    >
      <Button
        minimal
        rightIcon="caret-down"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          color: '#f5f8fa'
        }}
        disabled={isLoading || isLoggingOut}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#137cbd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            lineHeight: '1',
            textAlign: 'center',
            // Eliminăm orice margin/padding implicit care ar putea afecta centrarea
            margin: '0',
            padding: '0',
            // Forțăm poziționarea exactă în centru
            position: 'relative'
          }}
        >
          {user.first_name ? user.first_name[0].toUpperCase() : 
           user.username ? user.username[0].toUpperCase() : 
           user.email[0].toUpperCase()}
        </div>
        <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>
            {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.username || user.email.split('@')[0]}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            {user.email}
          </div>
        </div>
      </Button>
    </Popover>
  );
};

export default UserProfile; 