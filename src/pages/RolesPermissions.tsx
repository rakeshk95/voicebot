import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  org_id: string;
  permissions: {
    read: string[];
    write: string[];
  };
  status: 'active' | 'inactive';
  created_at: string;
  created_by: string;
  modified_at: string;
  modified_by: string;
  organization_name: string | null;
  isSystem?: boolean;
}

interface Organization {
  id: string;
  name: string;
}

const defaultPermissions: Permission[] = [
  // Organization permissions
  { id: "org_view", name: "View Organizations", description: "Can view organization details", module: "Organizations" },
  { id: "org_create", name: "Create Organizations", description: "Can create new organizations", module: "Organizations" },
  { id: "org_edit", name: "Edit Organizations", description: "Can edit organization details", module: "Organizations" },
  { id: "org_delete", name: "Delete Organizations", description: "Can delete organizations", module: "Organizations" },
  
  // User permissions
  { id: "user_view", name: "View Users", description: "Can view user details", module: "Users" },
  { id: "user_create", name: "Create Users", description: "Can create new users", module: "Users" },
  { id: "user_edit", name: "Edit Users", description: "Can edit user details", module: "Users" },
  { id: "user_delete", name: "Delete Users", description: "Can delete users", module: "Users" },
  
  // Campaign permissions
  { id: "campaign_view", name: "View Campaigns", description: "Can view campaigns", module: "Campaigns" },
  { id: "campaign_create", name: "Create Campaigns", description: "Can create new campaigns", module: "Campaigns" },
  { id: "campaign_edit", name: "Edit Campaigns", description: "Can edit campaign details", module: "Campaigns" },
  { id: "campaign_delete", name: "Delete Campaigns", description: "Can delete campaigns", module: "Campaigns" },
  { id: "campaign_assign", name: "Assign Campaigns", description: "Can assign campaigns to agents", module: "Campaigns" },
  
  // Analytics permissions
  { id: "analytics_view", name: "View Analytics", description: "Can view analytics data", module: "Analytics" },
  { id: "analytics_export", name: "Export Analytics", description: "Can export analytics data", module: "Analytics" },
];

const defaultRoles: Role[] = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "Full system access",
    org_id: "org_b150bdcc",
    permissions: {
      read: ["users", "roles", "organizations", "campaigns", "analytics"],
      write: ["users", "roles", "organizations", "campaigns", "analytics"]
    },
    status: "active",
    created_at: new Date().toISOString(),
    created_by: "system",
    modified_at: new Date().toISOString(),
    modified_by: "system",
    organization_name: null,
    isSystem: true
  },
  {
    id: "org_admin",
    name: "Organization Admin",
    description: "Full organization access",
    org_id: "org_b150bdcc",
    permissions: {
      read: ["users", "campaigns", "analytics"],
      write: ["users", "campaigns"]
    },
    status: "active",
    created_at: new Date().toISOString(),
    created_by: "system",
    modified_at: new Date().toISOString(),
    modified_by: "system",
    organization_name: null,
    isSystem: true
  },
  {
    id: "agent",
    name: "Agent",
    description: "Campaign execution access",
    org_id: "org_b150bdcc",
    permissions: {
      read: ["campaigns"],
      write: []
    },
    status: "active",
    created_at: new Date().toISOString(),
    created_by: "system",
    modified_at: new Date().toISOString(),
    modified_by: "system",
    organization_name: null,
    isSystem: true
  }
];

const defaultRole: Role = {
  id: "",
  name: "",
  description: null,
  org_id: "org_b150bdcc", // Default org_id
  permissions: {
    read: [],
    write: []
  },
  status: "active",
  created_at: new Date().toISOString(),
  created_by: "user_1", // Default user
  modified_at: new Date().toISOString(),
  modified_by: "user_1", // Default user
  organization_name: null
};

export default function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions] = useState<Permission[]>(defaultPermissions);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editMode, setEditMode] = useState<"add" | "edit">("add");
  const [isLoading, setIsLoading] = useState(true);
  const [newRole, setNewRole] = useState<Role>(defaultRole);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://192.168.2.135:8000/api/v1/roles/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch roles');
      }

      const rolesData = await response.json();
      console.log('Fetched roles:', rolesData);

      // Transform the roles data and sort by created_at date
      const transformedRoles = rolesData
        .map((role: any) => {
          let transformedPermissions;
          
          if (Array.isArray(role.permissions)) {
            transformedPermissions = {
              read: role.permissions.filter((p: string) => p === "*" || p.startsWith("read:")),
              write: role.permissions.filter((p: string) => p === "*" || p.startsWith("write:"))
            };
          } else {
            transformedPermissions = role.permissions;
          }

          const isSystemRole = role.name.toLowerCase() === 'superuser';

          return {
            ...role,
            permissions: transformedPermissions,
            isSystem: isSystemRole
          };
        })
        .sort((a: Role, b: Role) => {
          // Sort by created_at in descending order (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      setRoles(transformedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setIsLoadingOrgs(true);
      const response = await fetch('http://192.168.2.135:8000/api/v1/organizations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchOrganizations();
  }, []);

  const handleSaveRole = async () => {
    try {
      console.log('Saving Role Details:', {
        mode: editMode,
        roleData: newRole
      });

      // Prepare the request data in the correct format
      const roleData = {
        name: newRole.name,
        description: newRole.description || null,
        org_id: newRole.org_id,
        permissions: {
          read: newRole.permissions.read,
          write: newRole.permissions.write
        },
        status: newRole.status
      };

      console.log('Sending role data to API:', roleData);

      const baseUrl = 'http://192.168.2.135:8000/api/v1/roles';
      const url = editMode === "edit" ? `${baseUrl}/${newRole.id}` : baseUrl;
      
      const response = await fetch(url, {
        method: editMode === "edit" ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${editMode} role`);
      }

      const savedRole = await response.json();
      console.log('Role saved successfully:', savedRole);

      // Refresh the roles list to get the latest data
      await fetchRoles();

      toast({
        title: "Success",
        description: `Role ${editMode === "edit" ? "updated" : "created"} successfully`,
      });

      setIsAddDialogOpen(false);
      setNewRole(defaultRole);
      setEditMode("add");
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${editMode} role`,
        variant: "destructive",
      });
    }
  };

  const handleEditRole = (role: Role) => {
    console.log('Editing role:', role);
    setEditMode("edit");
    // Make a deep copy of the role to avoid direct state mutation
    setNewRole({
      ...role,
      permissions: {
        read: [...role.permissions.read],
        write: [...role.permissions.write]
      }
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`http://192.168.2.135:8000/api/v1/roles/${role.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete role');
      }

      // Refresh the roles list
      await fetchRoles();

      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingRole(null);
    }
  };

  const togglePermission = (permissionId: string, type: 'read' | 'write') => {
    setNewRole(prev => {
      const permissions = { ...prev.permissions };
      const permissionArray = permissions[type];
      
      // Get the module name from the permission ID
      const module = permissionId.split('_')[0];

      if (permissionArray.includes(module)) {
        // Remove the permission if it exists
        permissions[type] = permissionArray.filter(p => p !== module);
      } else {
        // Add the permission if it doesn't exist
        permissions[type] = [...permissionArray, module];
      }

      return {
        ...prev,
        permissions
      };
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setEditMode("add");
            setNewRole(defaultRole);
          }
          setIsAddDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editMode === "add" ? "Add New Role" : "Edit Role"}</DialogTitle>
              <DialogDescription>
                Define role details and assign permissions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter role name"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Role description"
                    value={newRole.description || ''}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select
                    value={newRole.org_id}
                    onValueChange={(value) => setNewRole({ ...newRole, org_id: value })}
                  >
                    <SelectTrigger id="organization" className="w-full">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Permissions</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Organizations Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Organizations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="org_view"
                            checked={newRole.permissions.read.includes('organizations')}
                            onCheckedChange={() => togglePermission('organizations', 'read')}
                          />
                          <Label htmlFor="org_view">View Organizations</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="org_create"
                            checked={newRole.permissions.write.includes('organizations')}
                            onCheckedChange={() => togglePermission('organizations', 'write')}
                          />
                          <Label htmlFor="org_create">Create/Edit/Delete Organizations</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Users Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Users</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="users_view"
                            checked={newRole.permissions.read.includes('users')}
                            onCheckedChange={() => togglePermission('users', 'read')}
                          />
                          <Label htmlFor="users_view">View Users</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="users_write"
                            checked={newRole.permissions.write.includes('users')}
                            onCheckedChange={() => togglePermission('users', 'write')}
                          />
                          <Label htmlFor="users_write">Create/Edit/Delete Users</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Campaigns Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="campaigns_view"
                            checked={newRole.permissions.read.includes('campaigns')}
                            onCheckedChange={() => togglePermission('campaigns', 'read')}
                          />
                          <Label htmlFor="campaigns_view">View Campaigns</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="campaigns_write"
                            checked={newRole.permissions.write.includes('campaigns')}
                            onCheckedChange={() => togglePermission('campaigns', 'write')}
                          />
                          <Label htmlFor="campaigns_write">Create/Edit/Delete Campaigns</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="campaigns_assign"
                            checked={newRole.permissions.write.includes('campaigns_assign')}
                            onCheckedChange={() => togglePermission('campaigns_assign', 'write')}
                          />
                          <Label htmlFor="campaigns_assign">Assign Campaigns</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analytics Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="analytics_view"
                            checked={newRole.permissions.read.includes('analytics')}
                            onCheckedChange={() => togglePermission('analytics', 'read')}
                          />
                          <Label htmlFor="analytics_view">View Analytics</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="analytics_export"
                            checked={newRole.permissions.write.includes('analytics')}
                            onCheckedChange={() => togglePermission('analytics', 'write')}
                          />
                          <Label htmlFor="analytics_export">Export Analytics</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewRole(defaultRole);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveRole} disabled={!newRole.name.trim()}>
                {editMode === "add" ? "Create Role" : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            Manage system roles and their permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Loading roles...
                    </div>
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No roles found
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description || 'No description'}</TableCell>
                    <TableCell>{role.created_by}</TableCell>
                    <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        role.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {role.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {!role.isSystem && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeletingRole(role)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role
              {deletingRole && <span className="font-medium"> "{deletingRole.name}"</span>} and remove its
              associated permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRole && handleDeleteRole(deletingRole)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 