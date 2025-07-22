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
import { Building2, Plus, Pencil, Trash2, Search, Eye, Filter, X, Calendar, Download, FileDown, Edit } from 'lucide-react';
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

const Organizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
  const { toast } = useToast();

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

  // Fix fetchOrganizations implementation
  const fetchOrganizations = async (showLoading = true) => {
    const controller = new AbortController();

    if (showLoading) {
      setIsInitialLoading(true);
    }

    try {
      const response = await fetch('http://192.168.2.135:8000/api/v1/organizations', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      
      // Map the data to ensure proper date handling
      const mappedData = Array.isArray(data) ? data.map(org => ({
        ...org,
        created_date: org.created_date || org.created_at || null,
        modified_date: org.modified_date || org.updated_at || null
      })) : [];
      
      setOrganizations(mappedData);
    } catch (error) {
      if (error.name === 'AbortError') return;
      
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch organizations",
        variant: "destructive",
      });
    } finally {
      if (showLoading) {
        setIsInitialLoading(false);
      }
    }

    return controller;
  };

  // Fix useEffect implementation
  useEffect(() => {
    const controller = fetchOrganizations(true);
    
    return () => {
      // Cleanup function to abort the fetch when component unmounts
      controller.then(ctrl => ctrl.abort());
    };
  }, []);

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

      const response = await fetch('http://192.168.2.135:8000/api/v1/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(apiData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create organization');
      }
      
      await fetchOrganizations(false);
      
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
      const response = await fetch(`http://192.168.2.135:8000/api/v1/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update organization');
      
      // Fetch fresh data without showing loading state
      await fetchOrganizations(false);
      
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
      const response = await fetch(`http://192.168.2.135:8000/api/v1/organizations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete organization');
      
      // Fetch fresh data without showing loading state
      await fetchOrganizations(false);
      
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
      const response = await fetch(`http://192.168.2.135:8000/api/v1/organizations/${orgId}`, {
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
    <div className="p-1 pt-0 bg-gray-50 min-h-screen">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Organizations
          </h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
            {filteredOrganizations.length} Total
          </Badge>
        </div>
        <p className="text-sm text-gray-500">Manage your organizations and their settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 p-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-[350px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-[140px]">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholderText="From date"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="MMM dd, yyyy"
                  maxDate={endDate || undefined}
                  customInput={
                    <Button variant="outline" className="w-full h-9 justify-start text-left font-normal border-gray-200">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      {startDate ? format(startDate, "MMM dd, yyyy") : "From date"}
                    </Button>
                  }
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="w-[140px]">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date) => setEndDate(date)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholderText="To date"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="MMM dd, yyyy"
                  minDate={startDate || undefined}
                  customInput={
                    <Button variant="outline" className="w-full h-9 justify-start text-left font-normal border-gray-200">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      {endDate ? format(endDate, "MMM dd, yyyy") : "To date"}
                    </Button>
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportToCSV}
                className="bg-white hover:bg-gray-50 h-9 border-gray-200 text-gray-700 hover:text-gray-900"
              >
                <FileDown className="w-4 h-4 mr-2 text-gray-500" />
                Export to CSV
              </Button>
              <Button 
                onClick={() => setIsDialogOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Organization
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Name</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Code</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Description</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Created Date</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Last Modified</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-2 px-4 text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInitialLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Loading organizations...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Building2 className="h-8 w-8 mb-2 text-gray-400" />
                      <p className="text-lg font-medium">No organizations found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => (
                  <TableRow key={org.id} className="hover:bg-gray-50/50 border-t border-gray-100">
                    <TableCell className="font-medium text-gray-900 py-2 px-4">{org.name}</TableCell>
                    <TableCell className="font-mono text-sm py-2 px-4 text-gray-600">{org.code}</TableCell>
                    <TableCell className="text-gray-600 py-2 px-4">{org.description || '-'}</TableCell>
                    <TableCell className="py-2 px-4">
                      <Badge variant="outline" className={cn(
                        "capitalize",
                        org.status === 'active' && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10",
                        org.status === 'inactive' && "bg-slate-100 text-slate-600 ring-1 ring-slate-500/10",
                        org.status === 'suspended' && "bg-red-50 text-red-700 ring-1 ring-red-600/10"
                      )}>
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-2 px-4">
                      {formatDate(org.created_at)}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-2 px-4">
                      {formatDate(org.modified_date)}
                    </TableCell>
                    <TableCell className="py-2 px-4">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleView(org.id)}
                          className="h-8 w-8 bg-blue-50 hover:bg-blue-100 text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(org)}
                          className="h-8 w-8 bg-amber-50 hover:bg-amber-100 text-amber-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteOrganization(org.id)}
                          className="h-8 w-8 bg-red-50 hover:bg-red-100 text-red-600"
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
      </div>

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