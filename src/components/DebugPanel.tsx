import React from 'react';
import { usePermissions } from '@/contexts/PermissionContext';

export const DebugPanel: React.FC = () => {
  const { userPermissions, userRole, isLoading } = usePermissions();
  
  // Only show for admin users
  const isAdmin = localStorage.getItem('userData')?.includes('admin@example.com');
  if (!isAdmin) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <h4>Debug Info</h4>
      <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
      <p><strong>User Role:</strong> {userRole?.name || 'null'}</p>
      <p><strong>User Permissions:</strong> {userPermissions ? 'Present' : 'null'}</p>
      <p><strong>Admin Flag:</strong> {userPermissions?.admin ? 'Yes' : 'No'}</p>
      <p><strong>Read Permissions:</strong> {JSON.stringify(userPermissions?.read || [])}</p>
      <p><strong>Write Permissions:</strong> {JSON.stringify(userPermissions?.write || [])}</p>
      <p><strong>Delete Permissions:</strong> {JSON.stringify(userPermissions?.delete || [])}</p>
      
      <h4>localStorage</h4>
      <p><strong>userData:</strong> {localStorage.getItem('userData') ? 'Present' : 'null'}</p>
      <p><strong>userRole:</strong> {localStorage.getItem('userRole') ? 'Present' : 'null'}</p>
      <p><strong>authToken:</strong> {localStorage.getItem('authToken') ? 'Present' : 'null'}</p>
      
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{
          background: 'red',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Clear Cache & Reload
      </button>
    </div>
  );
};
