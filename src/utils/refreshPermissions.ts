/**
 * Utility to refresh user permissions and clear cache
 * This forces the frontend to re-fetch user data from the backend
 */

export const refreshUserPermissions = () => {
  // Clear all cached user data
  localStorage.removeItem('userRole');
  localStorage.removeItem('userData');
  localStorage.removeItem('authToken');
  
  // Clear any other cached data
  localStorage.removeItem('userPermissions');
  localStorage.removeItem('currentUser');
  
  // Force page reload to trigger fresh login
  window.location.reload();
};

export const clearUserCache = () => {
  // Clear all user-related localStorage items
  const keysToRemove = [
    'userRole',
    'userData', 
    'authToken',
    'userPermissions',
    'currentUser',
    'token',
    'access_token'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('User cache cleared');
};

// Make it available globally for console access
(window as any).refreshUserPermissions = refreshUserPermissions;
(window as any).clearUserCache = clearUserCache;
