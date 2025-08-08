# Dynamic Permission System

## Overview

This application now implements a dynamic permission system that controls access to different features and pages based on user roles and permissions stored in the backend database. The system supports various permission formats and provides both route-level and component-level access control.

## Permission Formats Supported

The system supports multiple permission formats from your backend database:

### 1. Object Format
```json
{
  "read": ["roles", "campaigns"],
  "write": ["campaigns"]
}
```

### 2. Array Format with Prefixes
```json
["read:users", "write:users", "read:org", "write:org"]
```

### 3. Wildcard Permissions
```json
["*"]
```

### 4. Mixed Formats
```json
{"read": ["own", "campaigns"], "write": ["own", "campaigns"]}
```

## Core Components

### 1. PermissionContext (`src/contexts/PermissionContext.tsx`)

The main context that manages user permissions throughout the application.

**Features:**
- Fetches user permissions from the backend API
- Parses different permission formats
- Provides permission checking utilities
- Handles loading states

**Usage:**
```tsx
import { usePermissions } from '@/contexts/PermissionContext';

const MyComponent = () => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    userPermissions, 
    userRole,
    isLoading 
  } = usePermissions();

  // Check single permission
  const canEditCampaigns = hasPermission('write', 'campaigns');

  // Check multiple permissions (any)
  const canManageUsers = hasAnyPermission('write', ['users', 'roles']);

  // Check multiple permissions (all)
  const canManageEverything = hasAllPermissions('write', ['users', 'campaigns', 'organizations']);
};
```

### 2. PermissionGuard (`src/components/PermissionGuard.tsx`)

A component that conditionally renders content based on permissions.

**Features:**
- Route-level protection
- Component-level protection
- Fallback content support
- Multiple permission checking modes

**Usage:**
```tsx
import { PermissionGuard, CanRead, CanWrite } from '@/components/PermissionGuard';

// Basic usage
<CanRead resource="campaigns">
  <CampaignList />
</CanRead>

<CanWrite resource="campaigns">
  <CreateCampaignButton />
</CanWrite>

// Advanced usage
<PermissionGuard 
  action="write" 
  resource="campaigns"
  fallback={<AccessDeniedMessage />}
>
  <CampaignEditor />
</PermissionGuard>

// Multiple resources
<PermissionGuard 
  action="read" 
  resources={["campaigns", "analytics"]}
  requireAll={false} // Show if user has ANY of the permissions
>
  <Dashboard />
</PermissionGuard>
```

### 3. ProtectedRoute (`src/components/ProtectedRoute.tsx`)

A route wrapper that checks both authentication and permissions.

**Features:**
- Authentication checking
- Permission-based route protection
- Loading states
- Access denied handling

**Usage:**
```tsx
<Route 
  path="/campaigns" 
  element={
    <ProtectedRoute requiredPermission={{ action: 'read', resource: 'campaigns' }}>
      <Campaigns />
    </ProtectedRoute>
  } 
/>
```

## API Integration

### Backend Endpoints Used

1. **Get User Roles**: `GET /api/v1/roles/user/{user_id}`
   - Returns user's assigned roles with permissions
   - Called after login and when permissions need refresh

2. **Role Management**: All CRUD operations for roles
   - `POST /api/v1/roles/` - Create Role
   - `GET /api/v1/roles/` - Get Roles
   - `PUT /api/v1/roles/{role_id}` - Update Role
   - `DELETE /api/v1/roles/{role_id}` - Delete Role
   - `POST /api/v1/roles/assign` - Assign Role
   - `DELETE /api/v1/roles/assign/{user_id}/{role_id}` - Remove Role

### Permission Fetching Flow

1. User logs in successfully
2. Login component fetches user permissions from `/api/v1/roles/user/{user_id}`
3. Permissions are stored in localStorage as backup
4. PermissionContext fetches and parses permissions
5. Components use permissions to show/hide features

## Resource Mapping

The system maps frontend resources to backend permissions:

| Frontend Resource | Backend Permission | Description |
|------------------|-------------------|-------------|
| `dashboard` | `dashboard` | Dashboard access |
| `organizations` | `organizations` | Organization management |
| `campaigns` | `campaigns` | Campaign management |
| `call_history` | `call_history` | Call history access |
| `users` | `users` | User management |
| `analytics` | `analytics` | Analytics access |
| `roles` | `roles` | Role management |
| `settings` | `settings` | Settings access |

## Implementation Examples

### 1. Navigation Filtering

The sidebar automatically filters navigation items based on permissions:

```tsx
// In AppSidebar.tsx
const filteredNavigationItems = navigationItems.map(section => ({
  ...section,
  items: section.items.filter(item => {
    if (isLoading) return true; // Show all items while loading
    return hasPermission(item.permission.action, item.permission.resource);
  })
})).filter(section => section.items.length > 0);
```

### 2. Button-Level Permissions

Buttons and actions are conditionally rendered:

```tsx
<CanWrite resource="campaigns">
  <Button onClick={handleCreateCampaign}>
    Create Campaign
  </Button>
</CanWrite>

<CanRead resource="campaigns">
  <Button onClick={handleExportData}>
    Export Data
  </Button>
</CanRead>
```

### 3. Route Protection

Routes are protected at the router level:

```tsx
<Route 
  path="/campaigns/new" 
  element={
    <ProtectedRoute requiredPermission={{ action: 'write', resource: 'campaigns' }}>
      <CampaignFormPage mode="create" />
    </ProtectedRoute>
  } 
/>
```

### 4. Table Actions

Table action buttons are filtered based on permissions:

```tsx
<TableCell>
  <div className="flex justify-end space-x-1">
    <CanRead resource="campaigns">
      <Button onClick={() => handleView(campaign)}>
        <Eye className="h-4 w-4" />
      </Button>
    </CanRead>
    <CanWrite resource="campaigns">
      <Button onClick={() => handleEdit(campaign)}>
        <Edit className="h-4 w-4" />
      </Button>
    </CanWrite>
    <CanWrite resource="campaigns">
      <Button onClick={() => handleDelete(campaign)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </CanWrite>
  </div>
</TableCell>
```

## Permission Checking Methods

### 1. `hasPermission(action, resource)`
Checks if user has a specific permission.

```tsx
const canEditUsers = hasPermission('write', 'users');
```

### 2. `hasAnyPermission(action, resources)`
Checks if user has ANY of the specified permissions.

```tsx
const canManageContent = hasAnyPermission('write', ['campaigns', 'organizations']);
```

### 3. `hasAllPermissions(action, resources)`
Checks if user has ALL of the specified permissions.

```tsx
const canManageEverything = hasAllPermissions('write', ['users', 'campaigns', 'organizations']);
```

## Wildcard Permissions

The system supports wildcard permissions (`*`) which grant access to everything:

```json
{
  "read": ["*"],
  "write": ["*"]
}
```

When a wildcard is present, all permission checks return `true`.

## Error Handling

### Permission Fetching Errors
- If permission fetching fails, the system gracefully degrades
- Users see a loading state while permissions are being fetched
- Fallback to localStorage permissions if available

### Access Denied
- Users see an "Access Denied" page when trying to access unauthorized routes
- Components with permission guards simply don't render
- No error messages are shown for hidden components

## Best Practices

### 1. Always Use Permission Guards
```tsx
// Good
<CanWrite resource="campaigns">
  <CreateButton />
</CanWrite>

// Bad
{hasPermission('write', 'campaigns') && <CreateButton />}
```

### 2. Provide Fallbacks
```tsx
<CanRead resource="analytics" fallback={<NoAccessMessage />}>
  <AnalyticsDashboard />
</CanRead>
```

### 3. Use Appropriate Permission Levels
- Use `read` for viewing/list operations
- Use `write` for create/update/delete operations
- Be specific about resources

### 4. Handle Loading States
```tsx
if (isLoading) {
  return <LoadingSpinner />;
}
```

## Troubleshooting

### Common Issues

1. **Permissions not loading**
   - Check if user has assigned roles
   - Verify API endpoint is working
   - Check browser console for errors

2. **Components not showing**
   - Verify permission resource names match
   - Check if user has the required permissions
   - Ensure PermissionProvider is wrapping the app

3. **Routes not accessible**
   - Verify route protection is configured correctly
   - Check if user has the required permissions
   - Ensure ProtectedRoute is used correctly

### Debugging

Enable debug logging in PermissionContext:

```tsx
console.log('User permissions:', userPermissions);
console.log('User role:', userRole);
console.log('Permission check:', hasPermission('write', 'campaigns'));
```

## Migration Guide

### From Static Role-Based Access

1. Replace hardcoded role checks with permission checks
2. Update navigation filtering logic
3. Add permission guards to components
4. Update route protection
5. Test with different user roles

### Example Migration

**Before:**
```tsx
if (userRole === 'admin') {
  return <AdminPanel />;
}
```

**After:**
```tsx
<CanWrite resource="users">
  <AdminPanel />
</CanWrite>
```

## Security Considerations

1. **Client-side permissions are for UX only**
   - Always validate permissions on the backend
   - Client-side checks prevent unnecessary API calls
   - Backend should enforce all permissions

2. **Permission caching**
   - Permissions are cached in localStorage as backup
   - Refresh permissions when roles change
   - Clear permissions on logout

3. **Wildcard permissions**
   - Use sparingly and only for super admin roles
   - Consider more granular permissions for better security

## Future Enhancements

1. **Permission inheritance**
   - Support for role hierarchies
   - Inherited permissions from parent roles

2. **Dynamic permissions**
   - Real-time permission updates
   - WebSocket-based permission changes

3. **Permission analytics**
   - Track permission usage
   - Identify unused permissions

4. **Advanced permission types**
   - Time-based permissions
   - Location-based permissions
   - Conditional permissions 