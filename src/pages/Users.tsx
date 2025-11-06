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
import { Plus, Search, Eye, Pencil, Trash2, CalendarIcon, Phone, Mail, User as UserIcon, Building2, Lock, EyeOff, Edit, FileDown, ChevronRight, Users as UsersIcon, UserCheck, Shield, Calendar as CalendarIcon2, ChevronLeft } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from '@/contexts/PermissionProvider';

interface Role {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  direction: 'INBOUND' | 'OUTBOUND';
  state: 'TRIAL' | 'ACTIVE' | 'INACTIVE';
  org_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string | null;
  role?: 'superuser' | 'org_admin' | 'user' | 'agent' | 'manager';
  status: 'active' | 'inactive';
  organization_id: string | null;
  is_superuser: boolean;
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
  organization_name: string | null;
  role_id?: string;
  campaign_ids?: string[];
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
  role_id: z.string(),
  organization_id: z.string().optional(),
  status: z.string(),
  campaign_ids: z.array(z.string()).optional(),
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
  campaign_ids?: string[];
}

import { authorizedFetch } from '@/lib/api';
import { config } from '@/config/env';

export default function Users() {
  const { hasPermission, userPermissions } = usePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
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
  
  // Debug organizations state
  useEffect(() => {
    console.log('Users: Organizations state changed:', organizations);
  }, [organizations]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
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
    status: "active",
    campaign_ids: []
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingCreateData, setIsLoadingCreateData] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);

  // Resolve current user once for reuse across helpers (outside effects)
  const currentUserData: any = JSON.parse(localStorage.getItem('userData') || '{}');
  const isSuperUserGlobal: boolean = currentUserData?.role_name === 'superuser';

  // Frontend defaults as a last resort (when API returns empty)
  const getDefaultOrganizations = () => {
    if (currentUserData?.org_id) {
      return [{ id: currentUserData.org_id, name: currentUserData.org_name || 'My Organization' }];
    }
    return [] as Organization[];
  };

  // Check permissions for users management
  const canReadUsers = hasPermission('read', 'users');
  const canWriteUsers = hasPermission('write', 'users');
  const canDeleteUsers = hasPermission('delete', 'users');
  const isAdmin = userPermissions?.admin;

  // Note: Do not early-return before hooks below; render gate is handled in JSX

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      mobile_number: "",
      role_id: "",
      organization_id: "",
      status: "active",
      campaign_ids: [],
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

      // Fetch all users for client-side pagination
      // This is a temporary solution until backend supports proper pagination
      params.append("skip", "0");
      params.append("limit", "1000"); // Get all users
  
      const response = await fetch(`${config.apiBaseUrl}/users/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Backend returns a plain array, not a paginated response
      const allUsers: User[] = await response.json();
  
      // Optional: use Map for fast organization name lookup
      const orgMap = new Map(organizations.map((org) => [org.id, org.name]));
  
      const baseUsers = allUsers.map((user) => ({
        ...user,
        organization_name: orgMap.get(user.organization_id) || null,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        mobile_number: user.mobile_number || null,
        status: user.status || "active",
      }));
  
      // Enrich each user with role from roles API if missing
      const enriched = await Promise.all(
        baseUsers.map(async (u) => {
          if (u.role_id || u.role) return u;
          try {
            const r = await fetch(`${config.apiBaseUrl}/roles/user/${u.id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                "Content-Type": "application/json",
              },
            });
            if (r.ok) {
              const rolesResp: any[] = await r.json();
              if (Array.isArray(rolesResp) && rolesResp.length > 0) {
                const first = rolesResp[0];
                return {
                  ...u,
                  role_id: first.role_id || u.role_id,
                  role: (first.role_name as any) || u.role,
                };
              }
            }
          } catch (_e) {}
          return u;
        })
      );

      // Store all users and implement client-side pagination
      setAllUsers(enriched);
      setTotalItems(enriched.length);
      setTotalPages(Math.ceil(enriched.length / pageSize));
      
      // Pagination will be handled by useEffect
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
  

  // Fetch users only after organizations and campaigns are loaded
  useEffect(() => {
    if (organizations.length > 0 && campaigns.length > 0) {
      const delayedFetch = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delayedFetch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations, campaigns, roles, currentPage, pageSize]);

  // Update the search/filter effect
  useEffect(() => {
    if (organizations.length > 0 && campaigns.length > 0 && roles.length > 0) {
      const searchDelay = setTimeout(() => {
        setCurrentPage(1); // Reset to first page when filters change
        fetchUsers();
      }, 500);
      return () => clearTimeout(searchDelay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, startDate, endDate, organizations, campaigns, roles]);

  // Handle pagination when currentPage or pageSize changes
  useEffect(() => {
    if (allUsers.length > 0) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = allUsers.slice(startIndex, endIndex);
      setUsers(paginatedUsers);
      setTotalItems(allUsers.length);
      setTotalPages(Math.ceil(allUsers.length / pageSize));
    }
  }, [allUsers, currentPage, pageSize]);

  // Pre-fetch organizations, campaigns, and roles only once when component mounts
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        console.log('Users: Fetching organizations...');
        const response = await fetch('https://platform.voxiflow.com/api/v1/organizations/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('Users: Organizations API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Users: Organizations API error:', response.status, errorText);
          throw new Error(`Failed to fetch organizations: ${response.status}`);
        }

        const data = await response.json();
        console.log('Users: Organizations API raw data:', data);
        
        const orgsArray = Array.isArray(data) ? data : (Array.isArray((data as any)?.value) ? (data as any).value : []);
        console.log('Users: Parsed organizations array:', orgsArray);
        
        if (!orgsArray || orgsArray.length === 0) {
          console.log('Users: No organizations found, using fallback');
          const fallback = getDefaultOrganizations();
          setOrganizations(fallback);
        } else {
          console.log('Users: Setting organizations:', orgsArray);
          setOrganizations(orgsArray);
        }
      } catch (error) {
        console.error('Users: Error fetching organizations:', error);
        // Use fallback to avoid empty dropdown
        const fallback = getDefaultOrganizations();
        console.log('Users: Using fallback organizations:', fallback);
        setOrganizations(fallback);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive",
        });
      }
    };

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const isSuperUser = userData?.role_name === 'superuser';
    
    const fetchCampaignsData = async () => {
      try {
        // Build API URL with role-based filtering
        let campaignsUrl = 'https://platform.voxiflow.com/api/v1/campaigns/';
        if (!isSuperUser && userData?.org_id) {
          campaignsUrl += `?org_id=${userData.org_id}`;
          console.log('Users: Non-superuser - filtering campaigns by organization:', userData.org_id);
          // For non-superusers, campaigns are already filtered by their organization
          // No need to set additional filters
        }
        
        const response = await fetch(campaignsUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch campaigns');
        }

        const data = await response.json();
        setCampaigns(data);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast({
          title: "Error",
          description: "Failed to load campaigns",
          variant: "destructive",
        });
      }
    };

    const fetchRolesData = async () => {
      try {
        const response = await fetch('https://platform.voxiflow.com/api/v1/roles/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }

        const data = await response.json();
        const rolesArray = Array.isArray(data) ? data : (Array.isArray((data as any)?.value) ? (data as any).value : []);
        // Fallback: if no roles returned, try org-scoped
        if ((!rolesArray || rolesArray.length === 0) && currentUserData?.org_id) {
          try {
            const scoped = await fetch(`${config.apiBaseUrl}/roles/?org_id=${currentUserData.org_id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
              },
            });
            if (scoped.ok) {
              const scopedData = await scoped.json();
              const scopedArray = Array.isArray(scopedData) ? scopedData : (Array.isArray(scopedData?.value) ? scopedData.value : []);
              if (scopedArray && scopedArray.length > 0) {
                setRoles(scopedArray);
                return;
              }
            }
          } catch (_e) {}
        }
        setRoles(rolesArray || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast({
          title: "Error",
          description: "Failed to load roles",
          variant: "destructive",
        });
      }
    };

    // Fetch organizations, campaigns, and roles
    Promise.all([fetchOrganizations(), fetchCampaignsData(), fetchRolesData()]);
  }, []); // Empty dependency array means this runs once on mount

  // Function to fetch campaigns
  const fetchCampaigns = async () => {
    try {
      // Build API URL with role-based filtering
      let campaignsUrl = 'https://platform.voxiflow.com/api/v1/campaigns/';
      if (!isSuperUserGlobal && currentUserData?.org_id) {
        campaignsUrl += `?org_id=${currentUserData.org_id}`;
        console.log('Users: Non-superuser - filtering campaigns by organization:', currentUserData.org_id);
      }
      
      const response = await fetch(campaignsUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json().catch(() => null);
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    }
  };

  // Function to fetch roles and organizations data
  const fetchCreateUserData = async () => {
    try {
      setIsLoadingCreateData(true);
      // Build API URLs with role-based filtering
      let campaignsUrl = 'https://platform.voxiflow.com/api/v1/campaigns/';
      let orgsUrl = 'https://platform.voxiflow.com/api/v1/organizations';
      
      if (!isSuperUserGlobal && currentUserData?.org_id) {
        campaignsUrl += `?org_id=${currentUserData.org_id}`;
        console.log('Users: Non-superuser - filtering campaigns by organization:', currentUserData.org_id);
      }
      
      const [rolesResponse, orgsResponse, campaignsResponse] = await Promise.all([
        fetch('https://platform.voxiflow.com/api/v1/roles/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        }),
        isSuperUserGlobal ? fetch(orgsUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        }) : Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: currentUserData.org_id, name: currentUserData.org_name || 'My Organization' }]) }),
        fetch(campaignsUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        })
      ]);

      if (!rolesResponse.ok || !orgsResponse.ok || !campaignsResponse.ok) {
        throw new Error('Failed to fetch required data');
      }

      const [rolesDataRaw, orgsDataRaw, campaignsDataRaw] = await Promise.all([
        rolesResponse.json(),
        orgsResponse.json(),
        campaignsResponse.json()
      ]);

      let rolesData = Array.isArray(rolesDataRaw) ? rolesDataRaw : (Array.isArray(rolesDataRaw?.value) ? rolesDataRaw.value : []);
      let orgsData = Array.isArray(orgsDataRaw) ? orgsDataRaw : (Array.isArray(orgsDataRaw?.value) ? orgsDataRaw.value : []);
      const campaignsData = Array.isArray(campaignsDataRaw) ? campaignsDataRaw : (Array.isArray(campaignsDataRaw?.value) ? campaignsDataRaw.value : []);

      // If no global roles, try org-scoped fetch
      if ((!rolesData || rolesData.length === 0) && currentUserData?.org_id) {
        try {
          const scoped = await fetch(`${config.apiBaseUrl}/roles/?org_id=${currentUserData.org_id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            },
          });
          if (scoped.ok) {
            const scopedData = await scoped.json();
            rolesData = Array.isArray(scopedData) ? scopedData : (Array.isArray(scopedData?.value) ? scopedData.value : []);
          }
        } catch (_e) {}
      }

      // Non-superuser fallback if orgs still empty
      if (!isSuperUserGlobal && orgsData.length === 0 && currentUserData?.org_id) {
        orgsData = [{ id: currentUserData.org_id, name: currentUserData.org_name || 'My Organization' }];
      }

      if (!orgsData || orgsData.length === 0) {
        orgsData = getDefaultOrganizations();
      }

      setRoles(rolesData);
      setOrganizations(orgsData);
      setCampaigns(campaignsData);
      setCreateStep(1);
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
    if (roles.length === 0 || organizations.length === 0 || campaigns.length === 0) {
      fetchCreateUserData();
    } else {
      // Preselect user's org for non-superusers
      const defaultOrg = !isSuperUserGlobal && currentUserData?.org_id ? currentUserData.org_id : null;
      setCreateFormData(prev => ({ ...prev, organization_id: defaultOrg }));
      setCreateStep(1);
      setIsCreateDialogOpen(true);
    }
  };

  const handleDeleteUser = async (user: User) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/users/${user.id}`, {
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
    console.log('Available roles:', roles);
    setEditingUser(user);
    setIsDialogOpen(true);
    form.reset({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      mobile_number: user.mobile_number || "",
      role_id: user.role_id || "",
      organization_id: user.organization_id || "",  
      status: user.status || "active",
      campaign_ids: user.campaign_ids || [],
    });
  };

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    if (!editingUser) return;
    setIsSubmitting(true);

    try {
      // No need to find role, we already have the role_id
      const updateData = {
        ...data,
        organization_id: data.organization_id === 'none' ? null : data.organization_id
      };

      console.log('Sending update data:', updateData); // Debug log

      const response = await fetch(`${config.apiBaseUrl}/users/${editingUser.id}`, {
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

  // Helpers for create-user wizard
  const canProceedFromStep1 = () => {
    const { first_name, last_name, email, mobile_number, password } = createFormData;
    return (
      !!first_name?.trim() &&
      !!last_name?.trim() &&
      !!email?.trim() &&
      !!mobile_number?.trim() &&
      !!password?.trim()
    );
  };

  const canProceedFromStep2 = () => {
    const { organization_id, role_id } = createFormData;
    return !!organization_id && !!role_id;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createStep === 1) {
      if (!canProceedFromStep1()) return;
      setCreateStep(2);
      return;
    }
    if (createStep === 2) {
      if (!canProceedFromStep2()) return;
      setCreateStep(3);
      return;
    }
    // Step 3 -> Create
    await handleCreateUser(e);
  };

  // Modified create user function
  const handleCreateUser = async (e: React.FormEvent) => {
    console.log('[Users] Submit create user clicked');
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
        status: createFormData.status,
        campaign_ids: createFormData.campaign_ids || [],
      };

      // Basic client-side validation to avoid silent submits
      if (!createFormData.organization_id) {
        throw new Error('Please select an organization');
      }
      if (!createFormData.role_id) {
        throw new Error('Please select a role');
      }

      const response = await authorizedFetch('/users/', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      // Safely parse response - handle both JSON and text responses
      let data: any;
      try {
        // First, get the text content (can only read once)
        const text = await response.text();
        
        // Try to parse as JSON
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          // If JSON parsing fails, treat as text error
          if (!response.ok) {
            throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
          }
          // If response is OK but not JSON, wrap in object
          data = { message: text };
        }
      } catch (error: any) {
        // If reading response fails, throw with status info
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText || 'Request failed'}`);
        }
        throw error;
      }

      if (!response.ok) {
        const details = (data && typeof data === 'object' && data !== null)
          ? (data.detail ?? data.message ?? `HTTP ${response.status}`)
          : (typeof data === 'string' ? data : `HTTP ${response.status}`);
        throw new Error(details);
      }

      toast({
        title: "Success",
        description: "User created successfully!",
      });

      await fetchUsers();
      setIsCreateDialogOpen(false);
      setCreateStep(1);
      setCreateFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        mobile_number: "",
        role_id: "",
        organization_id: null,
        status: "active",
        campaign_ids: []
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

  // Bulk Actions
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsBulkActionLoading(true);
    try {
      const deletePromises = selectedUsers.map(userId => 
        fetch(`${config.apiBaseUrl}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        })
      );
      
      await Promise.all(deletePromises);
      
      // Update local state
      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      
      toast({
        title: "Bulk Delete Successful",
        description: `Successfully deleted ${selectedUsers.length} users`,
      });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast({
        title: "Bulk Delete Failed",
        description: "Failed to delete some users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    if (selectedUsers.length === 0) return;
    
    setIsBulkActionLoading(true);
    try {
      const updatePromises = selectedUsers.map(userId => 
        fetch(`${config.apiBaseUrl}/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setUsers(users.map(user => 
        selectedUsers.includes(user.id) 
          ? { ...user, status }
          : user
      ));
      setSelectedUsers([]);
      
      toast({
        title: "Bulk Update Successful",
        description: `Successfully updated ${selectedUsers.length} users to ${status}`,
      });
    } catch (error) {
      console.error('Error in bulk status change:', error);
      toast({
        title: "Bulk Update Failed",
        description: "Failed to update some users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleExportToCSV = async () => {
    setIsExporting(true);
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Convert users data to CSV format
      const headers = ['Name', 'Email', 'Role', 'Status', 'Mobile', 'Organization', 'Campaigns', 'Created Date'];
      const csvData = users.map(user => [
        `${user.first_name} ${user.last_name}`.trim() || 'Not Set',
        user.email,
        getRoleDisplayNameFromIdOrName(user.role_id, user.role as any),
        user.status,
        user.mobile_number || 'Not Set',
        user.organization_name,
        user.campaign_ids && user.campaign_ids.length > 0 
          ? user.campaign_ids.map(campaignId => {
              const campaign = campaigns.find(c => c.id === campaignId);
              return campaign ? campaign.name : campaignId;
            }).join('; ')
          : 'Not Set',
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
        title: "Export Successful",
        description: `Successfully exported ${users.length} users to CSV`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export users data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Helpers to resolve role via id or fallback to user's role string
  const resolveRoleName = (roleId?: string, roleNameFallback?: string) => {
    if (roleId) {
    const role = roles.find(r => r.id === roleId);
      if (role?.name) return role.name;
    }
    if (roleNameFallback) return roleNameFallback;
    return 'Not Set';
  };

  const getRoleDisplayNameFromIdOrName = (roleId?: string, roleNameFallback?: string) => {
    const roleName = resolveRoleName(roleId, roleNameFallback);
    if (roleName === 'Not Set' || roleName === 'Unknown Role') return roleName;
    const roleDisplayMap: { [key: string]: string } = {
      'superuser': 'Super Admin',
      'org_admin': 'Org Admin',
      'user': 'User',
      'agent': 'Agent',
      'manager': 'Manager'
    };
    return roleDisplayMap[roleName.toLowerCase()] || roleName;
  };

  const getRoleBadgeVariantFromIdOrName = (roleId?: string, roleNameFallback?: string) => {
    const roleName = resolveRoleName(roleId, roleNameFallback);
    if (roleName === 'Not Set' || roleName === 'Unknown Role') return 'outline';
    const roleVariantMap: { [key: string]: string } = {
      'superuser': 'bg-purple-50 text-purple-700 border-purple-200',
      'org_admin': 'bg-blue-50 text-blue-700 border-blue-200',
      'agent': 'bg-green-50 text-green-700 border-green-200',
      'manager': 'bg-amber-50 text-amber-700 border-amber-200',
      'user': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return roleVariantMap[roleName.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {(!canReadUsers && !isAdmin) ? (
        <div className="container mx-auto py-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to view users.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <>
        {/* Premium Header Section */}
        <div className="relative mb-8 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20 rounded-2xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] rounded-2xl"></div>
          
          {/* Content */}
          <div className="relative p-8">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <span className="hover:text-blue-600 cursor-pointer transition-colors">Dashboard</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-blue-600 font-medium">Users</span>
            </nav>
            
            {/* Main Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                    User Management
                  </h1>
                  <p className="text-gray-600 mt-1 font-medium">Manage your users and their permissions</p>
                </div>
              </div>
              
              {/* Animated Counter Badge */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur opacity-30 animate-pulse"></div>
                  <Badge className="relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-2 text-sm font-semibold shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>{users.length} Total Users</span>
                    </div>
          </Badge>
        </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'active').length}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Admin Users</p>
                    <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'superuser' || u.role === 'org_admin').length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-purple-600">{new Set(users.map(u => u.organization_id)).size}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-orange-600">{users.filter(u => {
                      const createdDate = new Date(u.created_at);
                      const now = new Date();
                      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
                    }).length}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CalendarIcon2 className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
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

        {/* Premium Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Export Button with Premium Styling */}
          <Button 
            onClick={handleExportToCSV}
            variant="outline" 
            disabled={isExporting}
            className="h-10 px-4 text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <FileDown className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
            )}
            <span className="font-medium">{isExporting ? 'Exporting...' : 'Export'}</span>
          </Button>
          
          {/* Add User Button with Premium Styling */}
          {canWriteUsers && (
            <Button 
              onClick={handleAddUserClick} 
              className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
              <span>Add User</span>
            </Button>
          )}
          
          {/* Bulk Actions Button */}
          {canWriteUsers && users.length > 0 && (
            <Button 
              variant="outline"
              className="h-10 px-4 text-gray-700 border-gray-300 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group relative overflow-hidden"
              onClick={() => setSelectedUsers(users.map(user => user.id))}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="w-4 h-4 mr-2 border-2 border-current rounded-sm group-hover:scale-110 transition-transform duration-200"></div>
              <span className="font-medium">Select All</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {selectedUsers.length}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-gray-600">Choose an action to perform on selected users</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('active')}
                disabled={isBulkActionLoading}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('inactive')}
                disabled={isBulkActionLoading}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkActionLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers([])}
                className="text-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Table Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden backdrop-blur-sm">
        {/* Table Header with Premium Styling */}
        <div className="bg-gradient-to-r from-gray-50 via-gray-100/30 to-gray-50 border-b border-gray-200/70 shadow-sm">
          <div className="overflow-hidden">
            <Table className="w-full table-fixed">
            <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-8">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAllUsers}
                    className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-32">
                <div className="flex items-center space-x-1">
                  <UserIcon className="h-3 w-3 text-gray-500" />
                  <span>Name</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-36">
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span>Email</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-20">
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-gray-500" />
                  <span>Role</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-16">
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Status</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-24">
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-gray-500" />
                  <span>Mobile</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-28">
                <div className="flex items-center space-x-1">
                  <Building2 className="h-3 w-3 text-gray-500" />
                  <span>Org</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-20">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-3 w-3 text-gray-500" />
                  <span>Campaigns</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide w-24">
                <div className="flex items-center space-x-1">
                  <CalendarIcon2 className="h-3 w-3 text-gray-500" />
                  <span>Created</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 py-3 px-1 text-xs uppercase tracking-wide text-right w-16">
                <div className="flex items-center justify-end space-x-1">
                  <Edit className="h-3 w-3 text-gray-500" />
                  <span>Actions</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isInitialLoading ? (
              // Premium Loading Skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-b border-gray-100">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-12"></div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex justify-end space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </TableCell>
              </TableRow>
              ))
            ) : users.length === 0 ? (
              // Premium Empty State
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <UserIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500 mb-6 max-w-sm">Try adjusting your search criteria or create a new user to get started.</p>
                    <Button onClick={handleAddUserClick} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First User
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow 
                  key={user.id} 
                  className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-indigo-50/30 transition-all duration-300 group hover:shadow-sm"
                >
                  <TableCell className="py-3 px-1 w-8">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-1 w-32">
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-md group-hover:shadow-lg transition-all duration-200 flex-shrink-0">
                        {`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate text-xs">
                      {`${user.first_name} ${user.last_name}`.trim() || "Not Set"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">ID: {user.id.slice(0, 4)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-1 w-36">
                    <div className="flex items-center space-x-1 min-w-0">
                      <Mail className="h-2 w-2 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 font-medium truncate text-xs">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-1 w-20">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize font-semibold px-1 py-0.5 rounded-full border transition-all duration-200 shadow-sm hover:shadow-md text-xs",
                        getRoleBadgeVariantFromIdOrName(user.role_id, user.role as any)
                      )}
                    >
                      <span className="truncate">{getRoleDisplayNameFromIdOrName(user.role_id, user.role as any)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-1 w-16">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize font-semibold px-1 py-0.5 rounded-full border transition-all duration-200 shadow-sm hover:shadow-md text-xs",
                        user.status === 'active' 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      )}
                    >
                      <div className="flex items-center space-x-1">
                        <div className={cn(
                          "w-1 h-1 rounded-full",
                          user.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                        )}></div>
                        <span>{user.status}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-1 w-24">
                    <div className="flex items-center space-x-1 min-w-0">
                      <Phone className="h-2 w-2 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate text-xs">{user.mobile_number || 'Not Set'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-1 w-28">
                    <div className="flex items-center space-x-1 min-w-0">
                      <Building2 className="h-2 w-2 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate text-xs">{user.organization_name || 'Not Set'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-1 w-20">
                    {user.campaign_ids && user.campaign_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-0.5">
                        {user.campaign_ids.slice(0, 1).map((campaignId) => {
                          const campaign = campaigns.find(c => c.id === campaignId);
                          return campaign ? (
                            <Badge key={campaignId} variant="secondary" className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 border-blue-200 truncate">
                              {campaign.name}
                            </Badge>
                          ) : null;
                        })}
                        {user.campaign_ids.length > 1 && (
                          <Badge variant="secondary" className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600">
                            +{user.campaign_ids.length - 1}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic text-xs">Not Set</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-1 w-24">
                    <div className="flex items-center space-x-1 min-w-0">
                      <CalendarIcon2 className="h-2 w-2 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate text-xs">{formatDate(user.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-1 w-16">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewingUser(user)}
                        className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group/btn rounded shadow-sm hover:shadow-md"
                        title="View User"
                      >
                        <Eye className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                      </Button>
                      {canWriteUsers && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="h-6 w-6 p-0 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200 group/btn rounded shadow-sm hover:shadow-md"
                            title="Edit User"
                          >
                            <Edit className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingUser(user)}
                            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group/btn rounded shadow-sm hover:shadow-md"
                            title="Delete User"
                          >
                            <Trash2 className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isInitialLoading && totalItems > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} users
            </span>
            
            {/* Items per page dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="w-[80px] h-9 text-sm border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 h-9 text-sm border-gray-200 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 h-9 text-sm ${
                      currentPage === pageNum 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 h-9 text-sm border-gray-200 hover:bg-gray-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <select 
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={createFormData.role_id || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCreateFormData(prev => ({ ...prev, role_id: value }));
                    }}
                  >
                    <option value="">Select role</option>
                    <option value="role1">Test Role 1</option>
                    <option value="role2">Test Role 2</option>
                    <option value="role3">Test Role 3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Organization *</label>
                  <select 
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={createFormData.organization_id || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCreateFormData(prev => ({ ...prev, organization_id: value }));
                    }}
                  >
                    <option value="">Select organization</option>
                    <option value="org1">Test Organization 1</option>
                    <option value="org2">Test Organization 2</option>
                    <option value="org3">Test Organization 3</option>
                  </select>
                </div>

                {editingUser && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select 
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={createFormData.status}
                    onChange={(e) => {
                      const value = e.target.value as 'active' | 'inactive';
                      setCreateFormData(prev => ({ ...prev, status: value }));
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                )}

                <FormField
                  control={form.control}
                  name="campaign_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaigns</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const currentIds = field.value || [];
                          if (currentIds.includes(value)) {
                            field.onChange(currentIds.filter(id => id !== value));
                          } else {
                            field.onChange([...currentIds, value]);
                          }
                        }}
                        value=""
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaigns" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((campaignId: string) => {
                            const campaign = campaigns.find(c => c.id === campaignId);
                            return campaign ? (
                              <Badge 
                                key={campaignId} 
                                variant="secondary" 
                                className="cursor-pointer"
                                onClick={() => {
                                  const newValue = field.value?.filter(id => id !== campaignId) || [];
                                  field.onChange(newValue);
                                }}
                              >
                                {campaign.name} ×
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      getRoleBadgeVariantFromIdOrName(viewingUser?.role_id, viewingUser?.role as any)
                    )}>
                      {getRoleDisplayNameFromIdOrName(viewingUser?.role_id, viewingUser?.role as any)}
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

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Assigned Campaigns</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    {viewingUser?.campaign_ids && viewingUser.campaign_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingUser.campaign_ids.map((campaignId) => {
                          const campaign = campaigns.find(c => c.id === campaignId);
                          return campaign ? (
                            <Badge key={campaignId} variant="outline" className="text-sm">
                              {campaign.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No campaigns assigned</span>
                    )}
                  </div>
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

      {/* Premium Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent className="sm:max-w-[500px] border-0 shadow-2xl">
          <div className="relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50/30 to-yellow-50/20 rounded-lg"></div>
            
            <div className="relative p-6">
              <AlertDialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="h-8 w-8 text-red-500" />
                </div>
                <AlertDialogTitle className="text-xl font-bold text-gray-900">
                  Delete User Account
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 mt-2">
                  <div className="space-y-2">
                    <p>You are about to permanently delete:</p>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {deletingUser ? `${deletingUser.first_name?.[0] || ''}${deletingUser.last_name?.[0] || ''}`.toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {deletingUser ? `${deletingUser.first_name} ${deletingUser.last_name}`.trim() : 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500">{deletingUser?.email}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ This action cannot be undone and will permanently remove all user data.
                    </p>
                  </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
              
              <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-6">
                <AlertDialogCancel 
                  disabled={isDeleting}
                  className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 font-medium"
                >
                  Cancel
                </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && handleDeleteUser(deletingUser)}
              disabled={isDeleting}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isDeleting ? (
                    <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting User...
                    </div>
              ) : (
                    <div className="flex items-center justify-center">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Premium Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (open) setCreateStep(1); }}>
        <DialogContent className="sm:max-w-[540px] md:max-w-[520px] max-h-[80vh] overflow-y-auto border-0 shadow-2xl">
          <div className="relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20 pointer-events-none"></div>
              <DialogHeader className="text-center pb-4 border-b border-gray-200/50">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Create New User
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2 max-w-md mx-auto">
                  Add a new user to your organization. Fill in the required information below to get started.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${createStep >= 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      1
                    </div>
                    <span className={`text-sm font-medium ${createStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>Basic Info</span>
                  </div>
                  <div className={`w-8 h-0.5 ${createStep >= 2 ? 'bg-blue-400' : 'bg-gray-200'}`}></div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${createStep >= 2 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      2
                    </div>
                    <span className={`text-sm font-medium ${createStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>Organization</span>
                  </div>
                  <div className={`w-8 h-0.5 ${createStep >= 3 ? 'bg-blue-400' : 'bg-gray-200'}`}></div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${createStep >= 3 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      3
                    </div>
                    <span className={`text-sm font-medium ${createStep >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>Review</span>
                  </div>
                </div>

                <div className={`${createStep === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}`}>
                  {/* Step 1: Basic Information Section */}
                  <div className={`${createStep === 1 ? '' : 'hidden'} space-y-4`}>
                    <div className="flex items-center space-x-2 mb-4">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    </div>
                    
                    <div className="space-y-3">
              <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative group">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="first_name"
                    value={createFormData.first_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, first_name: e.target.value })}
                            className="pl-9 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Enter first name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative group">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="last_name"
                    value={createFormData.last_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, last_name: e.target.value })}
                            className="pl-9 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Enter last name"
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
                    className="pl-9 h-10"
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
                    className="pl-9 pr-9 h-10"
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
                    </div>
                  </div>

                  {/* Step 2: Organization & Role Section */}
                  <div className={`${createStep === 2 ? '' : 'hidden'} space-y-4 md:col-span-2`}>
                    <div className="flex items-center space-x-2 mb-4">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Organization & Role</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="organization" className="text-sm font-medium text-gray-700">
                          Organization <span className="text-red-500">*</span>
                        </Label>
                <Select
                  value={createFormData.organization_id || ""}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, organization_id: value })}
                >
                  <SelectTrigger className="pl-9">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {(organizations || []).map((org) => (
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
                      {createFormData.role_id ? getRoleDisplayNameFromIdOrName(createFormData.role_id, createFormData.role_id) : "Select role"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(roles || []).map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {getRoleDisplayNameFromIdOrName(role.id, role.name)}
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

              <div className="space-y-2">
                <Label htmlFor="campaigns">Campaigns</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const currentIds = createFormData.campaign_ids || [];
                    if (currentIds.includes(value)) {
                      setCreateFormData({ 
                        ...createFormData, 
                        campaign_ids: currentIds.filter(id => id !== value) 
                      });
                    } else {
                      setCreateFormData({ 
                        ...createFormData, 
                        campaign_ids: [...currentIds, value] 
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    {(campaigns || [])
                      .filter(c => {
                        const selectedOrg = createFormData.organization_id || (!isSuperUserGlobal && currentUserData?.org_id) || undefined;
                        return selectedOrg ? c.org_id === selectedOrg : true;
                      })
                      .map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createFormData.campaign_ids && createFormData.campaign_ids.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {createFormData.campaign_ids.map((campaignId) => {
                      const campaign = campaigns.find(c => c.id === campaignId);
                      return campaign ? (
                        <Badge 
                          key={campaignId} 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => {
                            const currentIds = createFormData.campaign_ids || [];
                            setCreateFormData({ 
                              ...createFormData, 
                              campaign_ids: currentIds.filter(id => id !== campaignId) 
                            });
                          }}
                        >
                          {campaign.name} ×
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Review */}
                {createStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">First Name</div>
                        <div className="font-medium">{createFormData.first_name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Last Name</div>
                        <div className="font-medium">{createFormData.last_name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">{createFormData.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Mobile</div>
                        <div className="font-medium">{createFormData.mobile_number}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Organization</div>
                        <div className="font-medium">{organizations.find(o => o.id === createFormData.organization_id)?.name || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Role</div>
                        <div className="font-medium">{createFormData.role_id ? getRoleDisplayNameFromIdOrName(createFormData.role_id, createFormData.role_id) : '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="font-medium capitalize">{createFormData.status}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Campaigns</div>
                        <div className="font-medium">
                          {(createFormData.campaign_ids || []).map(id => campaigns.find(c => c.id === id)?.name).filter(Boolean).join(', ') || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

            <DialogFooter className="mt-4 pt-4 border-t border-gray-200/50">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreateSubmitting}
                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 font-medium h-10"
              >
                Cancel
              </Button>
              {createStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                  disabled={isCreateSubmitting}
                  className="w-full sm:w-auto h-10"
                >
                  Back
                </Button>
              )}
              {createStep < 3 ? (
                <Button
                  type="submit"
                  disabled={isCreateSubmitting || (createStep === 1 ? !canProceedFromStep1() : !canProceedFromStep2())}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 h-10"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isCreateSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 h-10"
                >
                  {isCreateSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating User...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Create User
                    </div>
                  )}
                </Button>
              )}
                </div>
              </DialogFooter>
              </form>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
