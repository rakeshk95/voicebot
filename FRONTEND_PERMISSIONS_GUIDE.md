# Frontend Permissions Guide

This guide explains how to use the new standardized permissions system for building dynamic frontend interfaces based on user roles and permissions.

## Overview

The permissions system has been completely redesigned to provide a consistent, frontend-friendly format that handles all the different permission formats in your database. This allows you to build dynamic sidebars, navigation menus, and access controls based on user permissions.

## API Endpoints

### 1. Get User Roles with Details
```
GET /api/v1/roles/user/{user_id}
```

Returns all roles assigned to a user with full role details and standardized permissions.

## Standardized Permissions Structure

All permissions are now returned in a consistent format:

```json
{
  "read": ["users", "campaigns", "roles"],
  "write": ["campaigns"],
  "delete": [],
  "admin": false,
  "permissions_list": ["users", "campaigns", "roles"]
}
```

### Permission Fields

- **`read`**: Array of resources the user can read
- **`write`**: Array of resources the user can modify
- **`delete`**: Array of resources the user can delete
- **`admin`**: Boolean indicating if user has full admin access
- **`permissions_list`**: Flat list of all permissions for easy checking

## Frontend Response Structure

The user roles endpoint returns:

```json
{
  "id": "role_id",
  "name": "Role Name",
  "description": "Role Description",
  "permissions": {
    "read": ["users", "campaigns"],
    "write": ["campaigns"],
    "delete": [],
    "admin": false,
    "permissions_list": ["users", "campaigns"]
  },
  "sidebar_items": ["dashboard", "users", "campaigns", "profile", "settings"],
  "navigation_items": ["home", "profile", "users", "campaigns", "settings"]
}
```

## Frontend Implementation Examples

### 1. Dynamic Sidebar Generation

```javascript
// React component example using the new PermissionContext
import { usePermissions } from '@/contexts/PermissionContext';

const Sidebar = () => {
  const { canAccessSidebarItem, userRole } = usePermissions();
  
  if (!userRole) return <div>Loading...</div>;
  
  return (
    <nav className="sidebar">
      {userRole.sidebar_items.map(item => (
        <SidebarItem 
          key={item} 
          item={item} 
          canAccess={canAccessSidebarItem(item)}
        />
      ))}
    </nav>
  );
};

const SidebarItem = ({ item, canAccess }) => {
  if (!canAccess) return null;
  
  // Render the sidebar item based on the item type
  switch(item) {
    case 'users':
      return <UsersMenuItem />;
    case 'campaigns':
      return <CampaignsMenuItem />;
    case 'dashboard':
      return <DashboardMenuItem />;
    default:
      return <MenuItem name={item} />;
  }
};
```

### 2. Permission-Based Access Control

```javascript
// Utility function to check permissions
import { usePermissions } from '@/contexts/PermissionContext';

const UserList = () => {
  const { hasPermission, userPermissions } = usePermissions();
  
  const canViewUsers = hasPermission('read', 'users');
  const canEditUsers = hasPermission('write', 'users');
  const canDeleteUsers = hasPermission('delete', 'users');
  
  if (!canViewUsers) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      <h1>Users</h1>
      {canEditUsers && <AddUserButton />}
      <UserTable />
      {canDeleteUsers && <BulkDeleteButton />}
    </div>
  );
};
```

### 3. Dynamic Navigation Menu

```javascript
const Navigation = () => {
  const { canAccessNavigationItem, userRole } = usePermissions();
  
  if (!userRole) return null;
  
  return (
    <nav className="top-navigation">
      {userRole.navigation_items.map(item => (
        <NavItem 
          key={item} 
          item={item} 
          canAccess={canAccessNavigationItem(item)}
        />
      ))}
    </nav>
  );
};
```

### 4. Route Protection

```javascript
// Protected route component
const ProtectedRoute = ({ 
  children, 
  requiredPermission 
}) => {
  const { hasPermission } = usePermissions();
  const hasAccess = hasPermission('read', requiredPermission);
  
  if (!hasAccess) {
    return <Navigate to="/access-denied" />;
  }
  
  return children;
};

// Usage in routing
<Route 
  path="/users" 
  element={
    <ProtectedRoute requiredPermission="users">
      <UserList />
    </ProtectedRoute>
  } 
/>
```

## Permission Checking Patterns

### 1. Simple Resource Check
```javascript
const { userPermissions } = usePermissions();
const canAccessUsers = userPermissions?.permissions_list.includes('users');
```

### 2. Action-Based Check
```javascript
const { hasPermission } = usePermissions();
const canEditCampaigns = hasPermission('write', 'campaigns');
```

### 3. Admin Override
```javascript
const { userPermissions } = usePermissions();
const canDoAnything = userPermissions?.admin;
```

### 4. Multiple Resource Check
```javascript
const { hasAllPermissions } = usePermissions();
const canManageContent = hasAllPermissions('read', ['campaigns', 'content']);
```

## Database Permission Formats Supported

The system automatically handles these formats:

### 1. JSON Object Format
```json
{"read": ["users", "campaigns"], "write": ["campaigns"]}
```

### 2. List Format
```json
["read:users", "write:campaigns", "read:roles"]
```

### 3. Admin Format
```json
["*"]
```

### 4. String JSON
```json
'{"read": ["test"], "write": ["test"]}'
```

## Available Permission Context Hooks

### `usePermissions()` Hook

```javascript
const {
  userPermissions,        // StandardizedPermissions object
  userRole,              // UserRole object with sidebar_items
  isLoading,             // Boolean loading state
  hasPermission,         // Function to check specific permissions
  hasAnyPermission,      // Function to check if user has any of multiple permissions
  hasAllPermissions,     // Function to check if user has all of multiple permissions
  canAccessSidebarItem,  // Function to check sidebar access
  canAccessNavigationItem, // Function to check navigation access
  refreshPermissions     // Function to refresh permissions
} = usePermissions();
```

### Permission Checking Functions

```javascript
// Check specific permission
const canReadUsers = hasPermission('read', 'users');
const canWriteCampaigns = hasPermission('write', 'campaigns');
const canDeleteRoles = hasPermission('delete', 'roles');

// Check multiple permissions (any)
const canManageUsers = hasAnyPermission('write', ['users', 'roles']);

// Check multiple permissions (all)
const canManageAll = hasAllPermissions('read', ['users', 'campaigns', 'organizations']);

// Check sidebar access
const canSeeUsersInSidebar = canAccessSidebarItem('users');

// Check navigation access
const canSeeUsersInNav = canAccessNavigationItem('users');
```

## Best Practices

### 1. Always Check Permissions
- Never assume a user has access to a feature
- Always verify permissions before rendering components
- Use the standardized permission structure

### 2. Graceful Degradation
- Hide features users can't access
- Show appropriate messages for restricted content
- Provide alternative actions when possible

### 3. Permission Caching
- Permissions are automatically cached after login
- Use `refreshPermissions()` when roles change
- Handle permission updates gracefully

### 4. Error Handling
- Handle permission check failures
- Show user-friendly error messages
- Log permission violations for security

## Example Complete Implementation

```javascript
// Main app with dynamic layout
import { PermissionProvider } from '@/contexts/PermissionContext';

const App = () => {
  return (
    <PermissionProvider>
      <div className="app">
        <Header />
        <div className="main-content">
          <Sidebar />
          <MainContent />
        </div>
      </div>
    </PermissionProvider>
  );
};

// Sidebar component
const Sidebar = () => {
  const { userRole, isLoading } = usePermissions();
  
  if (isLoading) return <SidebarSkeleton />;
  if (!userRole) return <NoAccess />;
  
  return (
    <nav className="sidebar">
      {userRole.sidebar_items.map(item => (
        <SidebarItem key={item} item={item} />
      ))}
    </nav>
  );
};

// Content component with permission checks
const MainContent = () => {
  const { hasPermission } = usePermissions();
  
  return (
    <main className="main-content">
      <Routes>
        <Route 
          path="/users" 
          element={
            hasPermission('read', 'users') ? <UserList /> : <AccessDenied />
          } 
        />
        <Route 
          path="/campaigns" 
          element={
            hasPermission('read', 'campaigns') ? <CampaignList /> : <AccessDenied />
          } 
        />
      </Routes>
    </main>
  );
};
```

## Testing Permissions

The system provides comprehensive logging to help debug permission issues:

1. Check browser console for permission parsing logs
2. Verify user role and permissions in the PermissionContext
3. Test with different user roles to ensure proper access control
4. Use the `refreshPermissions()` function to test permission updates

## Migration Notes

- Old permission formats are automatically converted
- No changes needed to existing database data
- Backward compatible with existing API calls
- New context provides enhanced functionality

## Support

For questions or issues with the permissions system:
1. Check the browser console for permission parsing logs
2. Verify your role permissions in the database
3. Test with different user roles
4. Review the permission parsing logic in PermissionContext.tsx

## Database Examples

Based on your current database structure:

```sql
-- Manager role
{"read": ["roles", "campaigns"], "write": ["campaigns"]}

-- Agent role  
{"read": ["users", "roles"], "write": ["users"]}

-- Superuser role
["*"]  -- Automatically converted to admin: true

-- Org Admin role
["read:users", "write:users", "read:org", "write:org"]

-- Regular user role
{"read": ["own", "campaigns"], "write": ["own", "campaigns"]}
```

All these formats are automatically parsed and converted to the standardized structure for consistent frontend usage.
