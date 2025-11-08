import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { usePermissions } from '@/contexts/PermissionProvider';
import { Building2, Plus, Pencil, Trash2, Search, Eye, Filter, X, Calendar, Download, FileDown, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Separator } from "@/components/ui/separator";
import { format, subDays, startOfToday, endOfToday, startOfDay, endOfDay } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cachedFetch, clearApiCache, authorizedFetch } from "@/lib/api";
import { config } from '@/config/env';

// Form schema
const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active')
});

// Define the status type
type OrganizationStatus = 'active' | 'inactive' | 'suspended';

interface Organization {
  id: string;
  name: string;
  code: string;
  status: OrganizationStatus;
  description: string | null;
  created_by: string;
  last_modified_by: string;
  created_at: string | null;
  modified_date: string | null;
  is_active: boolean;
}

interface FilterOptions {
  status: OrganizationStatus | 'all';
  startDate: Date | null;
  endDate: Date | null;
}

interface ApiResponse {
  items: Organization[];
  total: number;
  page: number;
  page_size: number;
}

const Organizations = () => {
  const { hasPermission, userPermissions } = usePermissions();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: 'all',
    startDate: null,
    endDate: null
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const { toast } = useToast();

  // Check permissions for organizations management
  const canReadOrganizations = hasPermission('read', 'organizations');
  const canWriteOrganizations = hasPermission('write', 'organizations');
  const canDeleteOrganizations = hasPermission('delete', 'organizations');
  const isAdmin = userPermissions?.admin;

  // If user can't read organizations, show access denied
  if (!canReadOrganizations && !isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to view organizations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const form = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      status: "active" as const
    },
  });

  // Add preset date ranges
  const datePresets = [
    { label: 'Today', getValue: () => ({ start: startOfToday(), end: endOfToday() }) },
    { label: 'Last 7 days', getValue: () => ({ start: subDays(startOfToday(), 6), end: endOfToday() }) },
    { label: 'Last 30 days', getValue: () => ({ start: subDays(startOfToday(), 29), end: endOfToday() }) },
    { label: 'Last 90 days', getValue: () => ({ start: subDays(startOfToday(), 89), end: endOfToday() }) }
  ];

  const handleDatePreset = (preset: { start: Date; end: Date }) => {
    setFilterOptions(prev => ({
      ...prev,
      startDate: preset.start,
      endDate: preset.end
    }));
  };

  const clearFilters = () => {
    setFilterOptions({
      status: 'all',
      startDate: null,
      endDate: null
    });
  };

  // Fetch organizations with client-side pagination
  const fetchOrganizations = async () => {
    try {
      setIsInitialLoading(true);
      
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      if (filterOptions.status !== 'all') {
        params.append("status", filterOptions.status);
      }
      
      if (filterOptions.startDate) {
        params.append("start_date", filterOptions.startDate.toISOString());
      }
      
      if (filterOptions.endDate) {
        params.append("end_date", filterOptions.endDate.toISOString());
      }
      
      // Fetch all organizations for client-side pagination
      params.append("skip", "0");
      params.append("limit", "1000"); // Get all organizations
      
      const response = await fetch(`${config.apiBaseUrl}/organizations/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Backend returns a plain array, not a paginated response
      const data: Organization[] = await response.json();
      
      // Store all organizations for client-side pagination
      setAllOrganizations(data);
      setTotalItems(data.length);
      setTotalPages(Math.ceil(data.length / pageSize));
      
      // Pagination will be handled by useEffect
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch organizations",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Simple refresh function to reload organizations data
  const refreshOrganizations = async () => {
    await fetchOrganizations();
  };

  // Fix: Properly implement useEffect with AbortController
  useEffect(() => {
    const controller = new AbortController();
    
    fetchOrganizations();
    
    return () => {
      controller.abort();
    };
  }, [currentPage, pageSize, searchTerm, filterOptions]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterOptions]);

  // Handle pagination when currentPage or pageSize changes
  useEffect(() => {
    if (allOrganizations.length > 0) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedOrganizations = allOrganizations.slice(startIndex, endIndex);
      setOrganizations(paginatedOrganizations);
      setTotalItems(allOrganizations.length);
      setTotalPages(Math.ceil(allOrganizations.length / pageSize));
    }
  }, [allOrganizations, currentPage, pageSize]);

  // Update create organization
  const createOrganization = async (data: z.infer<typeof organizationSchema>) => {
    setIsActionLoading(true);
    try {
      const apiData = {
        code: data.code,
        name: data.name,
        description: data.description || "",
        status: 'active'
      };

      const response = await authorizedFetch('/organizations/', {
        method: 'POST',
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create organization');
      }
      
      // Refresh organizations data
      await refreshOrganizations();
      
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
      
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Optimize update organization
  const updateOrganization = async (data: z.infer<typeof organizationSchema>) => {
    if (!editingOrg) return;
    setIsActionLoading(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update organization');
      
      // Refresh organizations data
      await refreshOrganizations();
      
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      
      setIsDialogOpen(false);
      setEditingOrg(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Optimize delete organization
  const deleteOrganization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;
    setIsActionLoading(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/organizations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete organization');
      
      // Refresh organizations data
      await refreshOrganizations();
      
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const onSubmit = (data: z.infer<typeof organizationSchema>) => {
    if (editingOrg) {
      updateOrganization(data);
    } else {
      createOrganization(data);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    form.reset({
      name: org.name,
      code: org.code,
      description: org.description || '',
      status: org.status
    });
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      // Try to parse the date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-'; // Invalid date
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  // Optimize view organization
  const handleView = async (orgId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/organizations/${orgId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization details');
      }
      
      const data = await response.json();
      
      setViewingOrg({
        id: data.id || '',
        name: data.name || '',
        code: data.code || '',
        status: data.status || 'active',
        description: data.description || null,
        created_by: data.created_by || '',
        last_modified_by: data.last_modified_by || '',
        created_at: data.created_at || '',
        modified_date: data.modified_date || '',
        is_active: data.is_active || true
      });
    } catch (error) {
      console.error('Error fetching organization details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch organization details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    // Text search
    const matchesSearch = 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.status.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filterOptions.status === 'all' || org.status === filterOptions.status;

    // Date range filter
    const createdDate = new Date(org.created_at || '');
    const matchesDateRange = 
      (!filterOptions.startDate || createdDate >= startOfDay(filterOptions.startDate)) &&
      (!filterOptions.endDate || createdDate <= endOfDay(filterOptions.endDate));

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const handleExportToCSV = () => {
    try {
      // Convert organizations data to CSV format
      const headers = ['Name', 'Code', 'Description', 'Status', 'Created Date', 'Last Modified'];
      const csvData = filteredOrganizations.map(org => [
        org.name,
        org.code,
        org.description || '',
        org.status,
        formatDate(org.created_at),
        formatDate(org.modified_date)
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
      link.setAttribute('download', `organizations_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 overflow-x-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Organizations
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredOrganizations.length} Total Organizations
                    {!canWriteOrganizations && !isAdmin && (
                      <span className="text-amber-600 ml-2">• Read-only Mode</span>
                    )}
                  </p>
                </div>
              </div>
              {!canWriteOrganizations && !isAdmin && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 shadow-sm">
                  View Only
                </Badge>
              )}
                </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">

        {/* Enhanced Toolbar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 mb-6 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-[400px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-[140px]">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date) => setStartDate(date)}
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholderText="From date"
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dateFormat="MMM dd, yyyy"
                    maxDate={endDate || undefined}
                    customInput={
                      <Button variant="outline" className="w-full h-10 justify-start text-left font-normal border-gray-200 bg-white/80 hover:bg-gray-50/80">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                        {startDate ? format(startDate, "MMM dd, yyyy") : "From date"}
                      </Button>
                    }
                  />
                </div>
                <span className="text-gray-400 font-medium">to</span>
                <div className="w-[140px]">
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date) => setEndDate(date)}
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholderText="To date"
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dateFormat="MMM dd, yyyy"
                    minDate={startDate || undefined}
                    customInput={
                      <Button variant="outline" className="w-full h-10 justify-start text-left font-normal border-gray-200 bg-white/80 hover:bg-gray-50/80">
                        <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                        {endDate ? format(endDate, "MMM dd, yyyy") : "To date"}
                      </Button>
                    }
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleExportToCSV}
                  className="bg-white/80 hover:bg-gray-50/80 h-10 border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2 text-gray-500" />
                  Export CSV
                </Button>
                {canWriteOrganizations && (
                <Button 
                  onClick={() => setIsDialogOpen(true)} 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-10 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Organization
                </Button>
                )}
              </div>
            </div>
          </div>
        </div>

            {/* Enhanced Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="w-full">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50/80 to-blue-50/30 hover:from-gray-50/80 hover:to-blue-50/30 border-b border-gray-200/50">
                      <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[20%]">
                        <div className="flex items-center gap-2">
                          Name
                          <span className="text-gray-400">↕</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[12%]">Code</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[18%]">Description</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[10%]">Status</TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[15%]">
                        <div className="flex items-center gap-2">
                          Created Date
                          <span className="text-gray-400">↕</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[15%]">Last Modified</TableHead>
                      <TableHead className="text-right font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[10%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {isInitialLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-gray-600 font-medium">Loading organizations...</p>
                        <p className="text-sm text-gray-400 mt-1">Please wait while we fetch your data</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrganizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <Building2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">No organizations found</p>
                        <p className="text-sm text-gray-400 mb-4">Try adjusting your search criteria or create a new organization</p>
                        {canWriteOrganizations && (
                          <Button 
                            onClick={() => setIsDialogOpen(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Organization
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrganizations.map((org, index) => (
                    <TableRow 
                      key={org.id} 
                      className={cn(
                        "group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 border-t border-gray-100/50",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      )}
                    >
                          <TableCell className="py-4 px-4 w-[20%]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors break-words">
                                  {org.name}
                                </p>
                                <p className="text-xs text-gray-500">Organization</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 w-[12%]">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md text-gray-700 break-all">
                              {org.code}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4 w-[18%]">
                            <p className="text-gray-600 break-words" title={org.description || ''}>
                              {org.description || '-'}
                            </p>
                          </TableCell>
                      <TableCell className="py-4 px-4 w-[10%]">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "capitalize font-medium px-3 py-1 rounded-full border-0 shadow-sm",
                            org.status === 'active' && "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
                            org.status === 'inactive' && "bg-slate-100 text-slate-700 hover:bg-slate-200",
                            org.status === 'suspended' && "bg-red-100 text-red-800 hover:bg-red-200"
                          )}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full mr-2",
                            org.status === 'active' && "bg-emerald-500",
                            org.status === 'inactive' && "bg-slate-400",
                            org.status === 'suspended' && "bg-red-500"
                          )} />
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4 w-[15%]">
                        <div className="text-sm text-gray-600">
                          <p className="font-medium break-words">{formatDate(org.created_at)}</p>
                          <p className="text-xs text-gray-400">Created</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 w-[15%]">
                        <div className="text-sm text-gray-600">
                          <p className="font-medium break-words">{formatDate(org.modified_date)}</p>
                          <p className="text-xs text-gray-400">Modified</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 w-[10%]">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleView(org.id)}
                            className="h-8 w-8 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 group/btn"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                          {canWriteOrganizations && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEdit(org)}
                                className="h-8 w-8 bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 shadow-sm hover:shadow-md transition-all duration-200 group/btn"
                                title="Edit Organization"
                              >
                                <Edit className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteOrganization(org.id)}
                                className="h-8 w-8 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 shadow-sm hover:shadow-md transition-all duration-200 group/btn"
                                title="Delete Organization"
                              >
                                <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
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
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} organizations
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

      {/* View Dialog */}
      <Dialog open={!!viewingOrg} onOpenChange={() => setViewingOrg(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              {viewingOrg?.name}
              <Badge variant={viewingOrg?.status === 'active' ? "default" : "secondary"} className="capitalize">
                {viewingOrg?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              View and manage organization details and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Organization Name</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">{viewingOrg?.name}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Organization Code</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-mono">{viewingOrg?.code}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Badge variant={viewingOrg?.status === 'active' ? "default" : "secondary"} className="capitalize">
                    {viewingOrg?.status}
                  </Badge>
                </div>
              </div>

              {viewingOrg?.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">{viewingOrg?.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {formatDate(viewingOrg?.created_at)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Last Modified</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {formatDate(viewingOrg?.modified_date)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingOrg ? 'Edit Organization' : 'Create New Organization'}
            </DialogTitle>
            <DialogDescription>
              {editingOrg 
                ? 'Update your organization information below.' 
                : 'Fill in the information below to create your organization.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input className="pl-9" placeholder="Enter organization name" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter organization code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editingOrg && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {editingOrg ? 'Update Organization' : 'Create Organization'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations; 
