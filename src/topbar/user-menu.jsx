import React from 'react';
import { observer } from 'mobx-react-lite';
import { useAuth } from '../context/AuthContext';
import UserProfile from '../components/auth/UserProfile';

export const UserMenu = observer(({ store }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Only show user profile when authenticated
  // Login is handled by the dedicated login page
  if (isAuthenticated) {
    return <UserProfile />;
  }

  // Don't show anything when not authenticated 
  // (user will be on login page anyway)
  return null;
});
