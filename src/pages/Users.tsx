import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Eye, Pencil, Trash2, CalendarIcon, Phone, Mail, User as UserIcon, Building2, Lock, EyeOff, Edit, FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays, startOfDay, endOfDay, startOfToday, endOfToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";
import { DateRange } from "react-day-picker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Badge } from "@/components/ui/badge";

interface Role {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string | null;
  role: 'superuser' | 'org_admin' | 'user' | 'agent';
  status: 'active' | 'inactive';
  organization_id: string | null;
  is_superuser: boolean;
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
  organization_name: string | null;
  role_id?: string;
}

interface ApiResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Form schema
const userSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  mobile_number: z.string().optional(),
  role: z.string(),
  organization_id: z.string().optional(),
  status: z.string(),
});

interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  role_id: string;
  organization_id: string | null;
  status: 'active' | 'inactive';
}

export default function Users() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [date, setDate] = useState<DateRange | undefined>();
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createFormData, setCreateFormData] = useState<UserFormData>({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    mobile_number: "",
    role_id: "",
    organization_id: null,
    status: "active"
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingCreateData, setIsLoadingCreateData] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      mobile_number: "",
      role: "user",
      organization_id: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (editingUser) {
      console.log('editingUser state changed:', editingUser);
    }
  }, [editingUser]);

  // Custom styles for the DatePicker
  const datePickerCustomStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: 40,
      borderRadius: 6,
      borderColor: 'rgb(226, 232, 240)',
      '&:hover': {
        borderColor: 'rgb(148, 163, 184)'
      }
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'rgb(148, 163, 184)'
    })
  };

  const datePresets = [
    { label: 'Today', getValue: () => ({ start: startOfToday(), end: endOfToday() }) },
    { label: 'Last 7 days', getValue: () => ({ start: subDays(startOfToday(), 6), end: endOfToday() }) },
    { label: 'Last 30 days', getValue: () => ({ start: subDays(startOfToday(), 29), end: endOfToday() }) },
    { label: 'Last 90 days', getValue: () => ({ start: subDays(startOfToday(), 89), end: endOfToday() }) }
  ];

  const handleDatePreset = (preset: { start: Date; end: Date }) => {
    setStartDate(preset.start);
    setEndDate(preset.end);
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const fetchUsers = async () => {
    try {
      setIsRefreshing(true);
  
      const params = new URLSearchParams();
  
      if (searchTerm) {
        params.append("search", searchTerm);
      }
  
      if (startDate) {
        params.append("start_date", startDate.toISOString());
      }
  
      if (endDate) {
        params.append("end_date", endDate.toISOString());
      }
  
      const response = await fetch(`http://192.168.29.119:9000/api/v1/users/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data: User[] = await response.json();
  
      // Optional: use Map for fast organization name lookup
      const orgMap = new Map(organizations.map((org) => [org.id, org.name]));
  
      const mappedUsers = data.map((user) => ({
        ...user,
        organization_name: orgMap.get(user.organization_id) || null,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        mobile_number: user.mobile_number || null,
        role: user.role || "user",
        status: user.status || "active",
      }));
  
      setUsers(mappedUsers);
      setTotalItems(mappedUsers.length);
      setTotalPages(1); // only 1 page since <10 users
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive",
      });
      setUsers([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  };
  

  // Optimize the fetch by removing unnecessary dependencies
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchUsers();
    }, 300); // Add a small delay to prevent too frequent API calls

    return () => clearTimeout(delayedFetch);
  }, [currentPage, pageSize]); // Only re-fetch when page or size changes

  // Separate effect for search and date filters
  useEffect(() => {
    const searchDelay = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      fetchUsers();
    }, 500); // Longer delay for search to prevent too many API calls while typing

    return () => clearTimeout(searchDelay);
  }, [searchTerm, startDate, endDate]);

  // Pre-fetch organizations only once when component mounts
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('http://192.168.29.119:9000/api/v1/organizations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
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
      }
    };

    fetchOrganizations();
  }, []); // Empty dependency array means this runs once on mount

  // Function to fetch roles and organizations data
  const fetchCreateUserData = async () => {
    try {
      setIsLoadingCreateData(true);
      const [rolesResponse, orgsResponse] = await Promise.all([
        fetch('http://192.168.29.119:9000/api/v1/roles/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        }),
        fetch('http://192.168.29.119:9000/api/v1/organizations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        })
      ]);

      if (!rolesResponse.ok || !orgsResponse.ok) {
        throw new Error('Failed to fetch required data');
      }

      const [rolesData, orgsData] = await Promise.all([
        rolesResponse.json(),
        orgsResponse.json()
      ]);

      setRoles(rolesData);
      setOrganizations(orgsData);
      setIsCreateDialogOpen(true);
    } catch (error) {
      console.error('Error fetching create user data:', error);
      toast({
        title: "Error",
        description: "Failed to load required data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCreateData(false);
    }
  };

  // Handle Add User button click
  const handleAddUserClick = () => {
    if (roles.length === 0 || organizations.length === 0) {
      fetchCreateUserData();
    } else {
      setIsCreateDialogOpen(true);
    }
  };

  const handleDeleteUser = async (user: User) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`http://192.168.29.119:9000/api/v1/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete user: ${response.status}`);
      }

      // Update local state after successful delete
      setUsers(users.filter(u => u.id !== user.id));

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingUser(null);
    }
  };

  const handleEdit = (user: User) => {
    console.log('Edit clicked for user:', user);
    setEditingUser(user);
    setIsDialogOpen(true);
    form.reset({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      mobile_number: user.mobile_number || "",
      role: user.role_id || "",
      organization_id: user.organization_id || "",
      status: user.status || "active",
    });
  };

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    if (!editingUser) return;
    setIsSubmitting(true);

    try {
      // No need to find role, we already have the role_id
      const updateData = {
        ...data,
        role_id: data.role, // data.role is already the role_id
        organization_id: data.organization_id === 'none' ? null : data.organization_id
      };

      console.log('Sending update data:', updateData); // Debug log

      const response = await fetch(`http://192.168.29.119:9000/api/v1/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update user: ${response.status}`);
      }

      const updatedUser = await response.json();

      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...updatedUser }
          : user
      ));

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Modified create user function
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreateSubmitting(true);

    try {
      const userData = {
        email: createFormData.email,
        password: createFormData.password,
        first_name: createFormData.first_name,
        last_name: createFormData.last_name,
        mobile_number: createFormData.mobile_number,
        role_id: createFormData.role_id,
        organization_id: createFormData.organization_id,
        status: createFormData.status
      };

      const response = await fetch('http://192.168.29.119:9000/api/v1/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }

      toast({
        title: "Success",
        description: "User created successfully!",
      });

      await fetchUsers();
      setIsCreateDialogOpen(false);
      setCreateFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        mobile_number: "",
        role_id: "",
        organization_id: null,
        status: "active"
      });
    } catch (error: any) {
      console.error("User creation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleExportToCSV = () => {
    try {
      // Convert users data to CSV format
      const headers = ['Name', 'Email', 'Role', 'Status', 'Mobile', 'Organization', 'Created Date'];
      const csvData = users.map(user => [
        `${user.first_name} ${user.last_name}`.trim() || 'Not Set',
        user.email,
        user.role === 'superuser' ? 'Super Admin' : user.role.replace('_', ' '),
        user.status,
        user.mobile_number || 'Not Set',
        user.organization_name || 'Not Set',
        formatDate(user.created_at)
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Users data exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export users data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-blue-600">Users</h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">
            {users.length} Total
          </Badge>
        </div>
        <p className="text-sm text-gray-500">Manage your users and their permissions</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative w-[280px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9"
            />
            </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-[130px]">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  placeholderText="From date"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="MMM dd, yyyy"
                  maxDate={endDate || undefined}
                  customInput={
                    <Input 
                      className="h-9 text-sm border-gray-200"
                      placeholder="From date"
                    />
                  }
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="w-[130px]">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date) => setEndDate(date)}
                  placeholderText="To date"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="MMM dd, yyyy"
                  minDate={startDate || undefined}
                  customInput={
                    <Input 
                      className="h-9 text-sm border-gray-200"
                      placeholder="To date"
                    />
                  }
                />
              </div>
            </div>
          </div>
      </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExportToCSV}
            variant="outline" 
            className="h-9 text-gray-600 border-gray-200"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={handleAddUserClick} 
            className="bg-blue-600 hover:bg-blue-700 text-white h-9"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-medium text-gray-600 py-3 px-4">Name</TableHead>
              <TableHead className="font-medium text-gray-600">Email</TableHead>
              <TableHead className="font-medium text-gray-600">Role</TableHead>
              <TableHead className="font-medium text-gray-600">Status</TableHead>
              <TableHead className="font-medium text-gray-600">Mobile</TableHead>
              <TableHead className="font-medium text-gray-600">Organization</TableHead>
              <TableHead className="font-medium text-gray-600">Created Date</TableHead>
              <TableHead className="font-medium text-gray-600 text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isInitialLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="text-gray-500">Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <UserIcon className="h-8 w-8 mb-2 text-gray-400" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50">
                  <TableCell className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {`${user.first_name} ${user.last_name}`.trim() || "Not Set"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "capitalize font-medium",
                      {
                        'bg-purple-50 text-purple-700 border-purple-200': user.role === 'superuser',
                        'bg-blue-50 text-blue-700 border-blue-200': user.role === 'org_admin',
                        'bg-green-50 text-green-700 border-green-200': user.role === 'agent',
                        'bg-gray-50 text-gray-700 border-gray-200': user.role === 'user'
                      }
                    )}>
                      {user.role === 'superuser' ? 'Super Admin' : user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "capitalize font-medium",
                      user.status === 'active' 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    )}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.mobile_number || 'Not Set'}</TableCell>
                  <TableCell className="text-gray-600">{user.organization_name || 'Not Set'}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewingUser(user)}
                        className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="h-8 w-8 p-0 text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                        className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Update user information below.' 
                : 'Fill in the information below to create a new user.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input {...field} className="pl-9" placeholder="Enter first name" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input {...field} className="pl-9" placeholder="Enter last name" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input type="email" {...field} className="pl-9" placeholder="Enter email address" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input {...field} className="pl-9" placeholder="Enter mobile number" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="pl-9">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Not Set</SelectItem>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editingUser && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingUser(null);
                    form.reset();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {editingUser ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    editingUser ? 'Save Changes' : 'Create User'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              {`${viewingUser?.first_name} ${viewingUser?.last_name}`.trim() || "Not Set"}
              <Badge variant={viewingUser?.status === 'active' ? "default" : "secondary"} className="capitalize">
                {viewingUser?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              View and manage user details and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {`${viewingUser?.first_name} ${viewingUser?.last_name}`.trim() || "Not Set"}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">{viewingUser?.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                      {
                        'bg-purple-100 text-purple-800': viewingUser?.role === 'superuser',
                        'bg-blue-100 text-blue-800': viewingUser?.role === 'org_admin',
                        'bg-green-100 text-green-800': viewingUser?.role === 'agent',
                        'bg-gray-100 text-gray-800': viewingUser?.role === 'user'
                      }
                    )}>
                      {viewingUser?.role === 'superuser' ? 'Super Admin' : viewingUser?.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Badge variant={viewingUser?.status === 'active' ? "default" : "secondary"} className="capitalize">
                      {viewingUser?.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">{viewingUser?.mobile_number || "Not Set"}</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">{viewingUser?.organization_name || "Not Set"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Created By</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">{viewingUser?.created_by}</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Modified By</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">{viewingUser?.modified_by}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {formatDate(viewingUser?.created_at)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Last Modified</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {formatDate(viewingUser?.modified_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user's account
              and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && handleDeleteUser(deletingUser)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to your organization. Fill in the required information below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="first_name"
                    value={createFormData.first_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, first_name: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="last_name"
                    value={createFormData.last_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, last_name: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="mobile_number"
                    type="tel"
                    value={createFormData.mobile_number}
                    onChange={(e) => setCreateFormData({ ...createFormData, mobile_number: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    className="pl-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select
                  value={createFormData.organization_id || ""}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, organization_id: value })}
                >
                  <SelectTrigger className="pl-9">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={createFormData.role_id}
                  onValueChange={(value) => {
                    console.log('Selected role ID:', value);
                    setCreateFormData({ ...createFormData, role_id: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role">
                      {roles.find(r => r.id === createFormData.role_id)?.name || "Select role"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={createFormData.status}
                  onValueChange={(value: 'active' | 'inactive') => setCreateFormData({ ...createFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreateSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreateSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                {isCreateSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
