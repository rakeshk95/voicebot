/**
 * Force reset all user data and permissions
 * This will completely clear everything and force a fresh login
 */

export const forceReset = () => {
  // Clear ALL localStorage
  localStorage.clear();
  
  // Clear sessionStorage too
  sessionStorage.clear();
  
  // Clear any cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Force redirect to login
  window.location.href = '/login';
};

// Make it available globally
(window as any).forceReset = forceReset;

// Auto-run this if we detect permission issues
if (typeof window !== 'undefined') {
  // Check if we're stuck in a permission loop
  const hasPermissionIssues = localStorage.getItem('userRole') && 
    !localStorage.getItem('userPermissions') && 
    window.location.pathname !== '/login';
  
  if (hasPermissionIssues) {
    console.log('Detected permission issues, auto-clearing cache...');
    setTimeout(() => {
      localStorage.clear();
      window.location.reload();
    }, 1000);
  }
}
