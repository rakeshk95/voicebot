import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WhatsAppNavigation from '@/components/WhatsAppNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Phone,
  Mail,
  Image,
  Video,
  FileText,
  Music
} from 'lucide-react';
import { WhatsAppMessage, WhatsAppBusinessAccount, WhatsAppSendMessageRequest } from '@/types/whatsapp';
import { getWhatsAppMessages, sendWhatsAppMessage, getWhatsAppBusinessAccounts } from '@/lib/whatsappApi';

const WhatsAppMessages: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [businessAccounts, setBusinessAccounts] = useState<WhatsAppBusinessAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'status' | 'to_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Send message form state
  const [sendForm, setSendForm] = useState<WhatsAppSendMessageRequest>({
    to: '',
    type: 'text',
    text: { body: '' }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [messagesData, accountsData] = await Promise.all([
        getWhatsAppMessages(),
        getWhatsAppBusinessAccounts()
      ]);
      
      setMessages(messagesData);
      setBusinessAccounts(accountsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch WhatsApp messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedAccount) {
      toast({
        title: 'Error',
        description: 'Please select a business account',
        variant: 'destructive'
      });
      return;
    }

    try {
      await sendWhatsAppMessage(sendForm, selectedAccount);
      
      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });
      
      setIsSendDialogOpen(false);
      resetSendForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const resetSendForm = () => {
    setSendForm({
      to: '',
      type: 'text',
      text: { body: '' }
    });
    setSelectedAccount('');
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <MessageSquare className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'outbound' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Filter and sort messages
  const filteredMessages = messages
    .filter(message => {
      const matchesSearch = message.to_number.includes(searchTerm) || 
                           message.content?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAccount = !selectedAccount || message.business_account_id === selectedAccount;
      return matchesSearch && matchesAccount;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'to_number':
          aValue = a.to_number;
          bValue = b.to_number;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading WhatsApp messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <WhatsAppNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Messages</h1>
          <p className="text-gray-600 mt-1">View and manage your WhatsApp messages</p>
        </div>
        
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send WhatsApp Message</DialogTitle>
              <DialogDescription>
                Send a new WhatsApp message to a contact
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_account">Business Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business account" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to">To (Phone Number)</Label>
                <Input
                  id="to"
                  value={sendForm.to}
                  onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                  placeholder="Enter phone number (e.g., +1234567890)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message_type">Message Type</Label>
                <Select 
                  value={sendForm.type} 
                  onValueChange={(value: any) => setSendForm({ ...sendForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {sendForm.type === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="message_body">Message</Label>
                  <Textarea
                    id="message_body"
                    value={sendForm.text?.body || ''}
                    onChange={(e) => setSendForm({ 
                      ...sendForm, 
                      text: { body: e.target.value }
                    })}
                    placeholder="Enter your message"
                    rows={4}
                  />
                </div>
              )}
              
              {sendForm.type !== 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="media_url">Media URL</Label>
                  <Input
                    id="media_url"
                    value={sendForm[sendForm.type as keyof WhatsAppSendMessageRequest]?.link || ''}
                    onChange={(e) => setSendForm({ 
                      ...sendForm, 
                      [sendForm.type]: { link: e.target.value }
                    })}
                    placeholder="Enter media URL"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All accounts</SelectItem>
                {businessAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="to_number">Phone</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.map((message) => (
          <Card key={message.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getMessageTypeIcon(message.message_type)}
                    <span className="font-medium">{message.to_number}</span>
                    <div className="flex items-center space-x-1">
                      {getDirectionIcon(message.direction)}
                      <span className="text-xs text-gray-500 capitalize">
                        {message.direction}
                      </span>
                    </div>
                    <Badge className={getStatusColor(message.status)}>
                      {message.status}
                    </Badge>
                  </div>
                  
                  {message.content && (
                    <p className="text-gray-700 mb-2">{message.content}</p>
                  )}
                  
                  {message.media_url && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      {getMessageTypeIcon(message.message_type)}
                      <span className="hover:underline cursor-pointer">
                        View {message.message_type}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                    <span>Sent: {new Date(message.created_at).toLocaleString()}</span>
                    {message.sent_at && (
                      <span>Delivered: {new Date(message.sent_at).toLocaleString()}</span>
                    )}
                    {message.delivered_at && (
                      <span>Read: {new Date(message.delivered_at).toLocaleString()}</span>
                    )}
                  </div>
                  
                  {message.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      Error: {message.error_message}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMessages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Messages Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedAccount 
                ? 'No messages match your current filters'
                : 'No WhatsApp messages have been sent yet'
              }
            </p>
            {!searchTerm && !selectedAccount && (
              <Button onClick={() => setIsSendDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Send First Message
              </Button>
            )}
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessages;
