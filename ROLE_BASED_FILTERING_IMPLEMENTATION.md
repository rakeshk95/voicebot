# Role-Based Filtering Implementation

## Overview
This document describes the implementation of role-based filtering for the dashboard and campaign data in the voicebot application. The system now automatically filters data based on user roles, ensuring that non-superuser users only see data from their own organization.

## User Role Structure
Based on the login API response, users have the following role structure:
```json
{
  "user_id": "user_1",
  "role_id": "role_1",
  "role_name": "superuser",
  "role_description": "Superuser with full access",
  "role_permissions": {
    "read": ["*"],
    "write": ["*"],
    "delete": ["*"],
    "admin": true,
    "permissions_list": ["*"],
    "can_create": true,
    "can_edit": true,
    "can_delete": true,
    "can_view": true
  },
  "organization_id": "org_c0c13018"
}
```

## Key Changes Made

### 1. Dashboard Component (`src/pages/Dashboard.tsx`)
- **Role Detection**: Added logic to detect if user is a superuser based on `userData.role_name === 'superuser'`
- **API Filtering**: Modified `fetchDashboard()` function to include `org_id` parameter for non-superusers
- **Organization Filtering**: Updated organization fetching logic to only show user's organization for non-superusers
- **Campaign Filtering**: Updated campaign fetching to include organization filter for non-superusers
- **Filter Access**: Fixed filter access issues for non-superusers - they can now see and use organization and campaign filters

**API Call Changes:**
- **Superuser**: `GET /api/v1/dashboard/comprehensive?days=30` (no org_id filter)
- **Non-superuser**: `GET /api/v1/dashboard/comprehensive?org_id=org_9b4e2701&days=30`

### 2. Campaigns Page (`src/pages/Campaigns.tsx`)
- **Role Detection**: Added role checking logic
- **Campaign API**: Modified to include `?org_id=user_org_id` for non-superusers
- **Organization Display**: Non-superusers only see their own organization
- **Filter Access**: Fixed organization filter to automatically set non-superuser's organization

### 3. CampaignDetails Component (`src/components/CampaignDetails/CampaignDetails.tsx`)
- **Organization Fetching**: Non-superusers only see their organization, superusers see all organizations
- **Role-Based Logic**: Added conditional organization fetching based on user role

### 4. BatchCalling Components (`src/components/BatchCalling/BatchCallUpload.tsx`)
- **Campaign Filtering**: Non-superusers only see campaigns from their organization
- **Organization Display**: Non-superusers see only their organization
- **Auto-Selection**: Organization is automatically selected for non-superusers

### 5. CallHistory Page (`src/pages/CallHistory.tsx`)
- **Campaign API**: Modified to include organization filter for non-superusers
- **Data Filtering**: Ensures non-superusers only see calls from their organization's campaigns

### 6. Users Page (`src/pages/Users.tsx`)
- **Campaign Filtering**: Non-superusers only see campaigns from their organization
- **Organization Display**: Non-superusers see only their organization

## Implementation Details

### Role Check Logic
```typescript
// Get user data and check role
const userData = JSON.parse(localStorage.getItem('userData') || '{}');
const isSuperUser = userData?.role_name === 'superuser';
```

### API URL Building
```typescript
// Build API URL with role-based filtering
let campaignsUrl = '/campaigns/';
if (!isSuperUser && userData?.org_id) {
  campaignsUrl += `?org_id=${userData.org_id}`;
  console.log('Non-superuser - filtering by organization:', userData.org_id);
}
```

### Organization Handling
```typescript
if (!isSuperUser && userData?.org_id) {
  // For non-superusers, only show their organization
  setOrganizations([{ 
    id: userData.org_id, 
    name: userData.user_name || userData.org_name || 'My Organization' 
  }]);
  // Set the organization filter to their organization for non-superusers
  setSelectedOrgFilter(userData.org_id);
  return; // Skip API call for non-superusers
}
```

### Filter Access Fixes
The implementation now properly handles filter access for non-superusers:

1. **Organization Filter**: 
   - Non-superusers see "My Organization" instead of "Organization"
   - Their organization is automatically selected
   - Filter shows their organization name

2. **Campaign Filter**:
   - Non-superusers can see and use the campaign filter
   - Campaigns are pre-filtered by their organization
   - Filter is not disabled for non-superusers

3. **Auto-Selection**:
   - Organization filters are automatically set to user's organization
   - Campaign filters work with the pre-selected organization

## API Endpoints Affected

### Dashboard
- **Before**: `/api/v1/dashboard/comprehensive?days=30`
- **After (Superuser)**: `/api/v1/dashboard/comprehensive?days=30`
- **After (Non-superuser)**: `/api/v1/dashboard/comprehensive?org_id=org_9b4e2701&days=30`

### Campaigns
- **Before**: `/api/v1/campaigns/`
- **After (Superuser)**: `/api/v1/campaigns/`
- **After (Non-superuser)**: `/api/v1/campaigns/?org_id=org_9b4e2701`

### Call Details
- **Before**: `/api/v1/dashboard/call-details-with-org?days=30`
- **After (Superuser)**: `/api/v1/dashboard/call-details-with-org?days=30`
- **After (Non-superuser)**: `/api/v1/dashboard/call-details-with-org?org_id=org_9b4e2701&days=30`

## Benefits

1. **Data Security**: Non-superuser users can only access data from their own organization
2. **Performance**: Reduced data transfer for non-superusers
3. **User Experience**: Cleaner interface showing only relevant data
4. **Compliance**: Meets organizational data access requirements
5. **Filter Access**: Non-superusers can still use filters to view their organization's data

## Testing Scenarios

### Superuser Login
- Should see all organizations in dropdown
- Should see all campaigns
- Should see dashboard data from all organizations
- Should be able to filter by any organization
- Should see "Organization" label

### Non-superuser Login
- Should only see their organization
- Should only see campaigns from their organization
- Should see dashboard data only from their organization
- Should not be able to access other organizations' data
- Should see "My Organization" label
- Should have organization filter automatically set to their organization
- Should be able to use campaign filter normally
- Should see their organization name in filters

## Console Logging

The implementation includes comprehensive console logging for debugging:
- User role detection
- API URL building
- Organization filtering decisions
- Campaign filtering decisions
- Filter access and auto-selection

## Future Enhancements

1. **Dynamic Permission Loading**: Load permissions from API instead of localStorage
2. **Role Hierarchy**: Support for multiple role levels beyond superuser/regular user
3. **Permission Caching**: Cache permissions to reduce API calls
4. **Audit Logging**: Log data access for compliance purposes

## Notes

- The implementation assumes that `userData.role_name` is set to "superuser" for superusers
- Organization ID is extracted from `userData.org_id`
- All changes are backward compatible and don't affect existing superuser functionality
- The filtering is applied at the API level for better performance and security
- **FIXED**: Non-superusers now have proper access to organization and campaign filters
- **FIXED**: Organization filters are automatically set for non-superusers
- **FIXED**: Campaign filters work properly for non-superusers
