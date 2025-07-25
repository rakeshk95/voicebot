import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Download, Filter, Search, Clock, MapPin, User, Play, Calendar as CalendarIcon, FileText, List, Tag, Star, Database as DatabaseIcon, Database, MessageCircle, Star as StarIcon, StarHalf, X, FileDown } from 'lucide-react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { format, addDays, subDays, startOfDay, endOfDay, startOfToday, endOfToday } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AppSidebar } from '@/components/AppSidebar';
import voxiflowLogo from '../assets/voxiflow-logo.svg';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TranscriptionMessage {
  content: string;
  timestamp: string;
  role: 'assistant' | 'user';
}

interface TranscriptionResponse {
  transcription: {
    messages: TranscriptionMessage[];
    call_id: string;
  };
}

interface Call {
  Sid: string;
  ParentCallSid: string;
  DateCreated: string;
  DateUpdated: string;
  AccountSid: string;
  To: string;
  From: string;
  PhoneNumber: string;
  PhoneNumberSid: string;
  Status: string;
  StartTime: string;
  EndTime: string;
  Duration: number;
  Price: number;
  Direction: string;
  AnsweredBy: string;
  ForwardedFrom: string;
  CallerName: string;
  Uri: string;
  CustomField: string;
  RecordingUrl: string;
  place_holders?: string;
  transcript?: string;
  summary?: string;
  categories?: string;
  extracted_data?: string;
  call_rating?: string;
  transcription?: TranscriptionResponse;
  rating?: number;
}

interface ExtractedData {
  category?: string;
  summary?: string;
  'extracted-data'?: string;
}

interface Campaign {
  id: string;
  name: string;
  created_at: string;
}

const CallHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const campaignName = searchParams.get('campaignName');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>("");
  const [isDataExtractionDialogOpen, setIsDataExtractionDialogOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isLoadingExtraction, setIsLoadingExtraction] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [isTranscriptionDialogOpen, setIsTranscriptionDialogOpen] = useState(false);
  const [selectedCallTranscription, setSelectedCallTranscription] = useState<TranscriptionResponse | null>(null);
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedCallForRating, setSelectedCallForRating] = useState<Call | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [selectedCallForDial, setSelectedCallForDial] = useState<Call | null>(null);
  const [callerName, setCallerName] = useState('');
  const [isCallingInProgress, setIsCallingInProgress] = useState(false);

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

  const durationRanges = [
    { label: "All Durations", value: "all" },
    { label: "< 1 minute", value: "0-60" },
    { label: "1-3 minutes", value: "60-180" },
    { label: "3-5 minutes", value: "180-300" },
    { label: "5-10 minutes", value: "300-600" },
    { label: "> 10 minutes", value: "600+" }
  ];

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
    { label: "In Progress", value: "in-progress" },
    { label: "No Answer", value: "no-answer" },
    { label: "Busy", value: "busy" }
  ];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const exportToCSV = (calls: Call[], campaignName: string) => {
    const headers = [
      'Date Created',
      'Campaign',
      'From',
      'To',
      'Duration',
      'Status',
      'Caller Name',
      'Rating'
    ];

    const data = calls.map(call => [
      call.DateCreated ? format(new Date(call.DateCreated), "yyyy-MM-dd HH:mm:ss") : '',
      campaignName,
      call.From,
      call.To,
      formatDuration(call.Duration || 0),
      call.Status,
      call.CallerName || '',
      call.rating || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `call_history_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchCallData = async (page = currentPage, targetCampaignId = selectedCampaign) => {
    if (!targetCampaignId) {
      toast({
        title: "Error",
        description: "Please select a campaign",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let formattedStartDate, formattedEndDate;

      if (startDate && endDate) {
        formattedStartDate = format(startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
        formattedEndDate = format(endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      } else {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 15);
        formattedStartDate = format(start, "yyyy-MM-dd'T'HH:mm:ss'Z'");
        formattedEndDate = format(end, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      }

      const apiUrl = new URL(`http://192.168.29.119:9000/api/v1/calls/external/${targetCampaignId}/list`);
      
      apiUrl.searchParams.append('start_date', formattedStartDate);
      apiUrl.searchParams.append('end_date', formattedEndDate);
      apiUrl.searchParams.append('page', Math.max(1, page).toString());
      apiUrl.searchParams.append('size', '10');
      
      if (searchTerm) {
        apiUrl.searchParams.append('search', searchTerm);
      }

      if (durationFilter !== "all") {
        const [min, max] = durationFilter.split("-").map(Number);
        if (max) {
          apiUrl.searchParams.append('duration_min', min.toString());
          apiUrl.searchParams.append('duration_max', max.toString());
        } else {
          apiUrl.searchParams.append('duration_min', min.toString());
        }
      }

      if (statusFilter !== "all") {
        apiUrl.searchParams.append('status', statusFilter);
      }

      console.log('Fetching calls with URL:', apiUrl.toString());

      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call history');
      }

      const data = await response.json();
      console.log('Raw API Response:', data);

      if (!data.calls || !Array.isArray(data.calls)) {
        console.error('Invalid response format - calls is not an array:', data);
        throw new Error('Invalid response format');
      }

      const mappedCalls = data.calls.map((call: any) => ({
        Sid: call.Sid || '',
        ParentCallSid: call.ParentCallSid || '',
        DateCreated: call.DateCreated || '',
        DateUpdated: call.DateUpdated || '',
        AccountSid: call.AccountSid || '',
        To: call.To || '',
        From: call.From || '',
        PhoneNumber: call.PhoneNumber || '',
        PhoneNumberSid: call.PhoneNumberSid || '',
        Status: (call.Status || '').toLowerCase(),
        StartTime: call.StartTime || '',
        EndTime: call.EndTime || '',
        Duration: call.Duration || 0,
        Price: call.Price || 0,
        Direction: call.Direction || '',
        AnsweredBy: call.AnsweredBy || '',
        ForwardedFrom: call.ForwardedFrom || '',
        CallerName: call.CallerName || '',
        Uri: call.Uri || '',
        CustomField: call.CustomField || '',
        RecordingUrl: call.RecordingUrl || '',
        rating: call.rating || 0
      }));

      console.log('Mapped Calls:', mappedCalls);

      setCalls(mappedCalls);
      setTotalItems(data.total || mappedCalls.length);
      setTotalPages(Math.ceil((data.total || mappedCalls.length) / 10));
      setCurrentPage(page);

      console.log('Updated State:', {
        page,
        totalItems: data.total || mappedCalls.length,
        recordsReceived: mappedCalls.length,
        totalPages: Math.ceil((data.total || mappedCalls.length) / 10)
      });
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast({
        title: "Error",
        description: "Failed to load call history. Please try again.",
        variant: "destructive",
      });
      setCalls([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://192.168.29.119:9000/api/v1/campaigns/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setAllCampaigns(data);

      if (campaignId && !campaignName) {
        const campaign = data.find(c => c.id === campaignId);
        if (campaign) {
          setSelectedCampaignName(campaign.name);
        }
      }

      if (!campaignId && data.length > 0) {
        const firstCampaign = data[0];
        setSelectedCampaign(firstCampaign.id);
        setSelectedCampaignName(firstCampaign.name);
        
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 15);
        
        setStartDate(start);
        setEndDate(end);

        fetchCallData(1, firstCampaign.id);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (campaignId && campaignName) {
      setSelectedCampaign(campaignId);
      setSelectedCampaignName(decodeURIComponent(campaignName));
      
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 15);
      
      setStartDate(start);
      setEndDate(end);
      
      fetchCallData(1, campaignId);
    } else {
      fetchCampaigns();
    }
  }, [campaignId, campaignName]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  };

  const getFilteredCalls = () => {
    return calls.filter(call => {
      const matchesSearch = searchTerm ? (
        call.To.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.From.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.Status.toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;

      const matchesDateRange = (!startDate || new Date(call.StartTime) >= startDate) &&
                             (!endDate || new Date(call.StartTime) <= endDate);

      return matchesSearch && matchesDateRange;
    });
  };

  const totalCalls = calls.length;
  const completedCalls = calls.filter(call => call.Status.toLowerCase() === 'completed').length;
  const avgDuration = calls.length ? 
    formatDuration(Math.floor(calls.reduce((acc, call) => acc + call.Duration, 0) / calls.length)) : 
    '0:00';
  const successRate = totalCalls ? Math.round((completedCalls / totalCalls) * 100) : 0;

  const handleClearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setStatusFilter("all");
    setSelectedCampaign("all");
    setSearchTerm("");
  };

  const fetchExtractedData = async (callId: string) => {
    setIsLoadingExtraction(true);
    try {
      const response = await fetch(`http://192.168.29.119:9000/api/v1/calls/${callId}/data-extraction`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch extracted data');
      }

      const data = await response.json();
      setExtractedData(data);
    } catch (error) {
      console.error('Error fetching extracted data:', error);
      toast({
        title: "Error",
        description: "Failed to load extracted data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExtraction(false);
    }
  };

  const handleDataExtractionClick = (callId: string) => {
    setSelectedCallId(callId);
    setIsDataExtractionDialogOpen(true);
    fetchExtractedData(callId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchCallData(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handlePageChange = (page: number) => {
    fetchCallData(page);
  };

  const handleCampaignChange = (value: string) => {
    const selectedCamp = allCampaigns.find(c => c.id === value);
    setSelectedCampaign(value);
    setSelectedCampaignName(selectedCamp?.name || '');
    setCurrentPage(1);
    fetchCallData(1, value);
  };

  const handleTranscriptionClick = async (callId: string) => {
    setIsTranscriptionDialogOpen(true);
    setIsLoadingTranscription(true);

    try {
      const response = await fetch(`http://192.168.29.119:9000/api/v1/calls/${callId}/transcription`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transcription');
      }

      const data = await response.json();
      setSelectedCallTranscription(data);
    } catch (error) {
      console.error('Error fetching transcription:', error);
      toast({
        title: "Error",
        description: "Failed to load transcription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTranscription(false);
    }
  };

  const formatMessageTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const handleRatingClick = (call: Call) => {
    setSelectedCallForRating(call);
    setCurrentRating(call.rating || 0);
    setIsRatingDialogOpen(true);
  };

  const handleRatingSubmit = async () => {
    if (!selectedCallForRating) return;

    setIsSubmittingRating(true);
    try {
      const response = await fetch(
        `http://192.168.29.119:9000/api/v1/calls/${selectedCallForRating.Sid}/rating`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rating: currentRating }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      setCalls(calls.map(call => 
        call.Sid === selectedCallForRating.Sid 
          ? { ...call, rating: currentRating }
          : call
      ));

      toast({
        title: "Success",
        description: "Call rating submitted successfully",
      });

      setIsRatingDialogOpen(false);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);

  return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <StarIcon key={`full-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => (
          <StarIcon key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
        ))}
      </div>
    );
  };

  const getCampaignName = (campaignId: string) => {
    const campaign = allCampaigns.find(c => c.id === campaignId);
    return campaign?.name || '-';
  };

  const initiateCall = async (call: Call, providedName?: string) => {
    setIsCallingInProgress(true);
    try {
      const response = await fetch('http://192.168.29.119:9000/api/v1/calls/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: call.To,
          from: call.From,
          caller_name: providedName || call.CallerName,
          campaign_id: selectedCampaign
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      toast({
        title: "Success",
        description: "Call initiated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: "Error",
        description: "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCallingInProgress(false);
      setIsCallDialogOpen(false);
      setCallerName('');
    }
  };

  const handleCallClick = (call: Call) => {
    if (call.CallerName) {
      initiateCall(call);
    } else {
      setSelectedCallForDial(call);
      setIsCallDialogOpen(true);
    }
  };

  {/* Debug information */}
  {process.env.NODE_ENV === 'development' && (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
      <h3 className="font-semibold mb-2">Debug Info:</h3>
      <div>Total Items: {totalItems}</div>
      <div>Current Page: {currentPage}</div>
      <div>Total Pages: {totalPages}</div>
      <div>Items in current page: {calls.length}</div>
              </div>
  )}

  return (
    <div className="flex h-screen bg-gray-50/50">
   
      {/* Main Content */}
      <div className="flex-1 min-w-0 pl-0">
        <div className="p-2">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-2">
            <div className="flex items-center gap-4">
                          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Call History
            </h1>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Campaign</span>
                <Select 
                  value={selectedCampaign} 
                  onValueChange={handleCampaignChange}
                >
                  <SelectTrigger className="w-[180px] h-8 border-gray-200 text-sm">
                    <SelectValue placeholder="Select Campaign">
                      {selectedCampaignName || 'Select Campaign'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id} className="text-sm">
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">From</span>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => {
                    setStartDate(date);
                    setCurrentPage(1);
                    fetchCallData(1);
                  }}
                  customInput={
                    <Button variant="outline" className="w-[140px] h-8 justify-start text-left font-normal border-gray-200 text-sm">
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                      {startDate ? format(startDate, "MMM dd, yyyy") : "Select date"}
                    </Button>
                  }
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={endDate || undefined}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">To</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date) => {
                    setEndDate(date);
                    setCurrentPage(1);
                    fetchCallData(1);
                  }}
                  customInput={
                    <Button variant="outline" className="w-[140px] h-8 justify-start text-left font-normal border-gray-200 text-sm">
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                      {endDate ? format(endDate, "MMM dd, yyyy") : "Select date"}
                    </Button>
                  }
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  minDate={startDate || undefined}
                />
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2">
            <div className="p-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Search</span>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <Input
                    placeholder="Search calls..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-8 w-[180px] h-8 border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Duration</span>
                <Select 
                  value={durationFilter} 
                  onValueChange={(value) => {
                    setDurationFilter(value);
                    setCurrentPage(1);
                    fetchCallData(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-8 border-gray-200 text-sm">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value} className="text-sm">
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Status</span>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                    fetchCallData(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-8 border-gray-200 text-sm">
                    <DatabaseIcon className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value} className="text-sm">
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {(searchTerm || startDate || endDate || durationFilter !== "all" || statusFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStartDate(null);
                      setEndDate(null);
                      setDurationFilter("all");
                      setStatusFilter("all");
                      fetchCallData(1);
                    }}
                    className="h-8 px-2 border-gray-200 text-sm gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </Button>
                )}

                <Button
                  onClick={() => exportToCSV(calls, selectedCampaignName)}
                  className="bg-green-600 hover:bg-green-700 text-white h-8 px-2 text-sm gap-1"
                  disabled={calls.length === 0}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Rest of your existing table code */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
          <Table>
            <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">S.NO</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Time</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Campaign</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">From</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">To</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Duration</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                          Loading calls...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !calls || calls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                        No calls found
                      </TableCell>
                    </TableRow>
                  ) : (
                    calls.map((call, index) => {
                      console.log('Rendering call:', call); // Debug log for each call
                      return (
                        <TableRow key={call.Sid} className="hover:bg-gray-50/50 border-t border-gray-100">
                          <TableCell className="py-2 px-4">{((currentPage - 1) * 10) + index + 1}</TableCell>
                          <TableCell className="py-2 px-4 text-gray-600 text-sm">
                            <div className="flex flex-col">
                              <span>{call.DateCreated ? formatDateTime(call.DateCreated) : 'N/A'}</span>
                              <span className="text-xs text-gray-400">
                                Updated: {call.DateUpdated ? formatDateTime(call.DateUpdated) : 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-4">{selectedCampaignName || '-'}</TableCell>
                          <TableCell className="py-2 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{call.From || 'N/A'}</span>
                              {call.CallerName && (
                                <span className="text-xs text-gray-500">{call.CallerName}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{call.To || 'N/A'}</span>
                              {call.ForwardedFrom && (
                                <span className="text-xs text-gray-500">Forwarded from: {call.ForwardedFrom}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-4">
                            <div className="flex flex-col">
                              <span className="text-gray-600">{formatDuration(call.Duration || 0)}</span>
                              <span className="text-xs text-gray-400">₹{(call.Price || 0).toFixed(2)}</span>
                            </div>
                  </TableCell>
                          <TableCell className="py-2 px-4">
                            <Badge variant="outline" className={`${getStatusColor(call.Status || '')} font-medium`}>
                              {call.Status || 'N/A'}
                              {call.AnsweredBy && (
                                <span className="ml-1 text-xs">({call.AnsweredBy})</span>
                              )}
                    </Badge>
                  </TableCell>
                          <TableCell className="py-2 px-4">
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCallClick(call)}
                                className="h-8 w-8 bg-green-50 hover:bg-green-100 text-green-600"
                                disabled={isCallingInProgress}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDataExtractionClick(call.Sid)}
                                className="h-8 w-8 bg-blue-50 hover:bg-blue-100 text-blue-600"
                              >
                                <Database className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleTranscriptionClick(call.Sid)}
                                className="h-8 w-8 bg-purple-50 hover:bg-purple-100 text-purple-600"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              {call.RecordingUrl ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => window.open(call.RecordingUrl, '_blank')}
                                  className="h-8 w-8 bg-green-50 hover:bg-green-100 text-green-600"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled
                                  className="h-8 w-8 bg-gray-50 text-gray-400"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRatingClick(call)}
                                className="h-8 w-8 bg-amber-50 hover:bg-amber-100 text-amber-600"
                              >
                                {call.rating ? (
                                  <StarRating rating={call.rating} />
                                ) : (
                                  <Star className="h-4 w-4" />
                                )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                      );
                    })
                  )}
            </TableBody>
          </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-2 px-4 border-t bg-white rounded-lg shadow-sm border border-gray-200 mt-3">
            <p className="text-sm text-gray-600">
              Showing {totalItems === 0 ? 0 : ((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} entries
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="px-3 h-8 text-sm border-gray-200"
              >
                Previous
              </Button>

              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                const ellipsis = (
                  <Button variant="outline" size="sm" disabled className="px-2 h-8 min-w-[32px] border-gray-200">
                    ...
                  </Button>
                );

                pages.push(
                  <Button
                    key={1}
                    variant={currentPage === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={isLoading}
                    className={`px-2 h-8 min-w-[32px] border-gray-200 ${
                      currentPage === 1 ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                    }`}
                  >
                    1
                  </Button>
                );

                let startPage = Math.max(2, currentPage - 1);
                let endPage = Math.min(totalPages - 1, currentPage + 1);

                if (currentPage <= 3) {
                  endPage = Math.min(maxVisiblePages - 2, totalPages - 1);
                }

                if (currentPage >= totalPages - 2) {
                  startPage = Math.max(2, totalPages - (maxVisiblePages - 2));
                }

                if (startPage > 2) {
                  pages.push(<React.Fragment key="ellipsis-1">{ellipsis}</React.Fragment>);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(i)}
                      disabled={isLoading}
                      className={`px-2 h-8 min-w-[32px] border-gray-200 ${
                        currentPage === i ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                      }`}
                    >
                      {i}
                    </Button>
                  );
                }

                if (endPage < totalPages - 1) {
                  pages.push(<React.Fragment key="ellipsis-2">{ellipsis}</React.Fragment>);
                }

                if (totalPages > 1) {
                  pages.push(
                    <Button
                      key={totalPages}
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={isLoading}
                      className={`px-2 h-8 min-w-[32px] border-gray-200 ${
                        currentPage === totalPages ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                      }`}
                    >
                      {totalPages}
                    </Button>
                  );
                }

                return pages;
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="px-3 h-8 text-sm border-gray-200"
              >
                Next
              </Button>
            </div>
          </div>

          {/* Data Extraction Dialog */}
          <Dialog 
            open={isDataExtractionDialogOpen} 
            onOpenChange={(open) => {
              if (!open) {
                setIsDataExtractionDialogOpen(false);
                setSelectedCallId(null);
                setExtractedData(null);
              }
            }}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  Call Data Extraction
                </DialogTitle>
              </DialogHeader>

              {isLoadingExtraction ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Loading extracted data...</span>
                </div>
              ) : extractedData ? (
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="category">Category</TabsTrigger>
                    <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Call Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {extractedData.summary}
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="category" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          try {
                            const categoryData = JSON.parse(
                              extractedData.category?.replace(/```json\n|\n```/g, '') || '{}'
                            );
                            return (
                              <div className="space-y-4">
                                {Object.entries(categoryData).map(([key, value]) => (
                                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="font-medium text-gray-700 mb-1">{key}</div>
                                    <div className="text-gray-600">{String(value)}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {
                            return <div className="text-gray-500">Invalid category data</div>;
                          }
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="extracted" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Extracted Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          try {
                            const extractedDataObj = JSON.parse(extractedData['extracted-data'] || '{}');
                            return (
                              <div className="space-y-4">
                                {Object.entries(extractedDataObj).map(([key, value]) => (
                                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="font-medium text-gray-700 mb-1">
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </div>
                                    <div className="text-gray-600">{value === null ? 'Not Available' : String(value)}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {
                            return <div className="text-gray-500">Invalid extracted data</div>;
                          }
                        })()}
        </CardContent>
      </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Transcription Dialog */}
          <Dialog 
            open={isTranscriptionDialogOpen} 
            onOpenChange={(open) => {
              if (!open) {
                setIsTranscriptionDialogOpen(false);
                setSelectedCallTranscription(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  Call Transcription
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4">
                {isLoadingTranscription ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Loading transcription...</span>
                  </div>
                ) : selectedCallTranscription ? (
                  <div className="space-y-4">
                    {selectedCallTranscription.transcription.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'assistant'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              message.role === 'assistant' ? 'text-gray-500' : 'text-blue-100'
                            }`}
                          >
                            {formatMessageTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No transcription available
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Rating Dialog */}
          <Dialog 
            open={isRatingDialogOpen} 
            onOpenChange={(open) => {
              if (!open) {
                setIsRatingDialogOpen(false);
                setSelectedCallForRating(null);
                setHoverRating(0);
              }
            }}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  Rate Call
                </DialogTitle>
              </DialogHeader>

              <div className="py-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        className="relative"
                        onMouseEnter={() => setHoverRating(rating)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setCurrentRating(rating)}
                      >
                        <StarIcon
                          className={`w-10 h-10 transition-colors ${
                            rating <= (hoverRating || currentRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                        {rating === Math.ceil(hoverRating || currentRating) && (
                          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600">
                            {rating === 1 ? 'Poor' :
                             rating === 2 ? 'Fair' :
                             rating === 3 ? 'Good' :
                             rating === 4 ? 'Very Good' :
                             'Excellent'}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="h-6 text-sm text-gray-500">
                    {currentRating > 0 && !hoverRating && 
                      (currentRating === 1 ? 'Poor' :
                       currentRating === 2 ? 'Fair' :
                       currentRating === 3 ? 'Good' :
                       currentRating === 4 ? 'Very Good' :
                       'Excellent')}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsRatingDialogOpen(false)}
                  disabled={isSubmittingRating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRatingSubmit}
                  disabled={currentRating === 0 || isSubmittingRating}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600"
                >
                  {isSubmittingRating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Rating"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Call Dialog */}
          <AlertDialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Enter Caller Name</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a name for the caller before initiating the call.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Enter caller name"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full"
                  disabled={isCallingInProgress}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isCallingInProgress}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedCallForDial && initiateCall(selectedCallForDial, callerName)}
                  disabled={!callerName.trim() || isCallingInProgress}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isCallingInProgress ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Initiating...
                    </div>
                  ) : (
                    "Start Call"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default CallHistory;
