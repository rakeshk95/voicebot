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
import { Plus, MessageSquare, Send, Play, Pause, Edit, Trash2, Eye } from 'lucide-react';
import { WhatsAppCampaign, WhatsAppCampaignCreate, WhatsAppBusinessAccount } from '@/types/whatsapp';
import { getWhatsAppCampaigns, createWhatsAppCampaign, getWhatsAppBusinessAccounts } from '@/lib/whatsappApi';
import { getCampaigns } from '@/lib/api';

const WhatsAppCampaigns: React.FC = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [businessAccounts, setBusinessAccounts] = useState<WhatsAppBusinessAccount[]>([]);
  const [voiceCampaigns, setVoiceCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<WhatsAppCampaignCreate>({
    name: '',
    business_account_id: '',
    campaign_id: '',
    template_name: '',
    template_params: {},
    message_content: '',
    media_url: '',
    media_type: '',
    status: 'draft',
    org_id: '',
    created_by: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignsData, accountsData, voiceCampaignsData] = await Promise.all([
        getWhatsAppCampaigns(),
        getWhatsAppBusinessAccounts(),
        getCampaigns()
      ]);
      
      setCampaigns(campaignsData);
      setBusinessAccounts(accountsData);
      setVoiceCampaigns(voiceCampaignsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch WhatsApp campaigns',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const campaignData = {
        ...formData,
        created_by: userData.id || 'unknown',
        org_id: userData.org_id || ''
      };

      await createWhatsAppCampaign(campaignData);
      
      toast({
        title: 'Success',
        description: 'WhatsApp campaign created successfully'
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      business_account_id: '',
      campaign_id: '',
      template_name: '',
      template_params: {},
      message_content: '',
      media_url: '',
      media_type: '',
      status: 'draft',
      org_id: '',
      created_by: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading WhatsApp campaigns...</p>
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
          <h1 className="text-3xl font-bold">WhatsApp Campaigns</h1>
          <p className="text-gray-600 mt-1">Create and manage your WhatsApp messaging campaigns</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create WhatsApp Campaign</DialogTitle>
              <DialogDescription>
                Set up a new WhatsApp messaging campaign
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_account_id">Business Account</Label>
                  <Select 
                    value={formData.business_account_id} 
                    onValueChange={(value) => setFormData({ ...formData, business_account_id: value })}
                  >
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="campaign_id">Link to Voice Campaign (Optional)</Label>
                <Select 
                  value={formData.campaign_id} 
                  onValueChange={(value) => setFormData({ ...formData, campaign_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice campaign to link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {voiceCampaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template_name">Template Name</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                    placeholder="Enter WhatsApp template name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="media_type">Media Type</Label>
                  <Select 
                    value={formData.media_type} 
                    onValueChange={(value) => setFormData({ ...formData, media_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {formData.media_type && (
                <div className="space-y-2">
                  <Label htmlFor="media_url">Media URL</Label>
                  <Input
                    id="media_url"
                    value={formData.media_url}
                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                    placeholder="Enter media URL"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="message_content">Message Content</Label>
                <Textarea
                  id="message_content"
                  value={formData.message_content}
                  onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                  placeholder="Enter your message content"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign}>
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(campaign.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(campaign.status)}
                    <span className="capitalize">{campaign.status}</span>
                  </div>
                </Badge>
              </div>
              <CardDescription>
                Template: {campaign.template_name}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {campaign.message_content && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {campaign.message_content.length > 100 
                    ? `${campaign.message_content.substring(0, 100)}...` 
                    : campaign.message_content
                  }
                </div>
              )}
              
              {campaign.media_type && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="capitalize">{campaign.media_type}</span>
                  {campaign.media_url && (
                    <span className="text-blue-600 hover:underline cursor-pointer">
                      View Media
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500">
                  Created: {new Date(campaign.created_at).toLocaleDateString()}
                </span>
                
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Send className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No WhatsApp Campaigns</h3>
            <p className="text-gray-600 mb-4">
              Create your first WhatsApp campaign to start messaging your customers
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppCampaigns;
