// RolesPermissions.tsx
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
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/contexts/PermissionContext";
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

const defaultRole: Role = {
  id: "",
  name: "",
  description: null,
  org_id: "org_b150bdcc",
  permissions: { read: [], write: [] },
  status: "active",
  created_at: new Date().toISOString(),
  created_by: "user_1",
  modified_at: new Date().toISOString(),
  modified_by: "user_1",
  organization_name: null
};

export default function RolesPermissions() {
  const { hasPermission, userPermissions, isLoading: permissionsLoading } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<"add" | "edit">("add");
  const [isLoading, setIsLoading] = useState(true);
  const [newRole, setNewRole] = useState<Role>(defaultRole);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);

  // Permissions
  const canReadRoles = hasPermission('read', 'roles');
  const canWriteRoles = hasPermission('write', 'roles');
  const canDeleteRoles = hasPermission('delete', 'roles');
  const isAdmin = userPermissions?.admin;

  // Loading state
  if (permissionsLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Permissions...</CardTitle>
            <CardDescription>
              Please wait while we load your permissions...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied
  if (!canReadRoles && !isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view roles and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Contact your administrator to request access to this page.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://192.168.0.6:8000/api/v1/roles/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Failed to fetch roles');

      const rolesData = await response.json();
      const transformedRoles = rolesData
        .map((role: any) => ({
          ...role,
          permissions: role.permissions || { read: [], write: [] },
          isSystem: role.name.toLowerCase() === 'superuser'
        }))
        .sort((a: Role, b: Role) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRoles(transformedRoles);
      setFilteredRoles(transformedRoles);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => {
    setFilteredRoles(
      searchTerm.trim()
        ? roles.filter(role =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : roles
    );
  }, [searchTerm, roles]);

  const handleSaveRole = async () => {
    try {
      const roleData = {
        name: newRole.name,
        description: newRole.description || null,
        org_id: newRole.org_id,
        permissions: newRole.permissions,
        status: newRole.status
      };
      const baseUrl = 'http://192.168.0.6:8000/api/v1/roles';
      const url = editMode === "edit" ? `${baseUrl}/${newRole.id}` : baseUrl;

      const response = await fetch(url, {
        method: editMode === "edit" ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleData)
      });
      if (!response.ok) throw new Error((await response.json()).detail || `Failed to ${editMode} role`);

      await fetchRoles();
      toast({
        title: "Success",
        description: `Role ${editMode === "edit" ? "updated" : "created"} successfully`,
      });
      setIsAddDialogOpen(false);
      setNewRole(defaultRole);
      setEditMode("add");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${editMode} role`,
        variant: "destructive",
      });
    }
  };

  const handleEditRole = (role: Role) => {
    setEditMode("edit");
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
      const response = await fetch(`http://192.168.0.6:8000/api/v1/roles/${role.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Failed to delete role');

      await fetchRoles();
      toast({ title: "Success", description: "Role deleted successfully" });
    } catch (error) {
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

  const togglePermission = (module: string, type: 'read' | 'write') => {
    setNewRole(prev => {
      const permissions = { ...prev.permissions };
      const arr = permissions[type];
      permissions[type] = arr.includes(module) ? arr.filter(p => p !== module) : [...arr, module];
      return { ...prev, permissions };
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Roles & Permissions</h1>
          <p className="text-gray-600 text-sm">
            Manage roles and their permissions.
            {!canWriteRoles && !isAdmin && (
              <span className="text-amber-600 ml-2 font-medium">(Read-only mode)</span>
            )}
          </p>
        </div>
        {(canWriteRoles || isAdmin) && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setEditMode("add");
              setNewRole(defaultRole);
            }
            setIsAddDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-10">
                <Plus className="mr-2 h-4 w-4" /> Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-gray-900">{editMode === "add" ? "Add New Role" : "Edit Role"}</DialogTitle>
                <DialogDescription className="text-gray-600">Define role details and assign permissions.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
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
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-900">Permissions</Label>
                  <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {['organizations', 'users', 'campaigns'].map(module => (
                      <div key={module} className="space-y-3">
                        <Label className="text-sm font-medium capitalize text-gray-700">{module}</Label>
                        {['read', 'write'].map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${module}_${type}`}
                              checked={newRole.permissions[type].includes(module)}
                              onCheckedChange={() => togglePermission(module, type as 'read' | 'write')}
                            />
                            <Label htmlFor={`${module}_${type}`} className="text-sm capitalize text-gray-600">{type}</Label>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-8 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setNewRole(defaultRole);
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveRole} disabled={!newRole.name.trim()} className="px-6 bg-blue-600 hover:bg-blue-700">
                  {editMode === "add" ? "Create Role" : "Update Role"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search roles by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 text-sm"
        />
      </div>

      {/* Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Roles</CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            Showing {filteredRoles.length} of {roles.length} roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-700 py-2 px-2 text-xs w-32">Role Name</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-2 px-2 text-xs w-40">Description</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-2 px-2 text-xs w-28">Created By</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-2 px-2 text-xs w-24">Created At</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-2 px-2 text-xs w-20">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-2 px-2 text-xs w-32">Read Permissions</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-2 px-2 text-xs w-32">Write Permissions</TableHead>
                  {(canWriteRoles || isAdmin) && <TableHead className="text-right font-semibold text-gray-700 py-2 px-2 text-xs w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={(canWriteRoles || isAdmin) ? 8 : 7} className="text-center py-6">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      <span className="text-sm">Loading roles...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(canWriteRoles || isAdmin) ? 8 : 7} className="text-center py-6 text-gray-500 text-sm">
                    {searchTerm ? 'No roles found matching your search.' : 'No roles found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id} className="hover:bg-gray-50/50 border-t border-gray-100">
                    <TableCell className="font-medium text-gray-900 py-2 px-2 text-xs max-w-32 truncate" title={role.name}>{role.name}</TableCell>
                    <TableCell className="py-2 px-2 text-xs max-w-40 truncate" title={role.description || 'No description'}>{role.description || 'No description'}</TableCell>
                    <TableCell className="py-2 px-2 text-xs">{role.created_by}</TableCell>
                    <TableCell className="text-gray-600 py-2 px-2 text-xs">{new Date(role.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="py-2 px-2">
                      <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        role.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {role.status}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.read.length > 0 ? (
                          role.permissions.read.map((perm, i) => (
                            <span key={i} className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">{perm}</span>
                          ))
                        ) : <span className="text-gray-400 text-xs">None</span>}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.write.length > 0 ? (
                          role.permissions.write.map((perm, i) => (
                            <span key={i} className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{perm}</span>
                          ))
                        ) : <span className="text-gray-400 text-xs">None</span>}
                      </div>
                    </TableCell>
                    {(canWriteRoles || isAdmin) && (
                      <TableCell className="py-2 px-2">
                        {!role.isSystem && (
                          <div className="flex justify-end space-x-1">
                            {(canWriteRoles || isAdmin) && (
                              <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)} className="h-7 w-7 bg-blue-50 hover:bg-blue-100 text-blue-600">
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {(canDeleteRoles || isAdmin) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingRole(role)}
                                className="h-7 w-7 bg-red-50 hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
                          </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will permanently delete
              {deletingRole && <span className="font-medium text-gray-900"> "{deletingRole.name}"</span>} and remove its permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel disabled={isDeleting} className="px-4">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRole && handleDeleteRole(deletingRole)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 px-4"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
