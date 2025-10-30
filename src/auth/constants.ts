export const AUTH_KEYS = {
    ACCESS: 'auth_v2_access_token',
    REFRESH: 'auth_v2_refresh_token',
    USER: 'auth_v2_userData',
    ROLE: 'auth_v2_userRole'
  };
  
  // Endpoints requiring user id as arg (since /me is not available)
  export const ENDPOINTS = {
    REFRESH: '/api/v1/auth/refresh',
    PROFILE: (userId) => `/api/v1/users/${userId}`,
    PERMISSIONS: (userId) => `/api/v1/roles/user/${userId}`,
  };