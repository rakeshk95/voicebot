import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WhatsAppNavigation from '@/components/WhatsAppNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Settings, MessageSquare, Phone, Building2, Trash2, Edit } from 'lucide-react';
import { WhatsAppBusinessAccount, WhatsAppBusinessAccountCreate } from '@/types/whatsapp';
import { getWhatsAppBusinessAccounts, createWhatsAppBusinessAccount, updateWhatsAppBusinessAccount } from '@/lib/whatsappApi';
import { getOrganizations } from '@/lib/api';

const WhatsAppBusinessAccounts: React.FC = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<WhatsAppBusinessAccount[]>([]);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<WhatsAppBusinessAccount | null>(null);

  // Form state
  const [formData, setFormData] = useState<WhatsAppBusinessAccountCreate>({
    business_account_id: '',
    name: '',
    phone_number_id: '',
    access_token: '',
    webhook_verify_token: '',
    org_id: '',
    is_active: true,
    created_by: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, orgsData] = await Promise.all([
        getWhatsAppBusinessAccounts(),
        getOrganizations()
      ]);
      
      setAccounts(accountsData);
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch WhatsApp business accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const accountData = {
        ...formData,
        created_by: userData.id || 'unknown'
      };

      await createWhatsAppBusinessAccount(accountData);
      
      toast({
        title: 'Success',
        description: 'WhatsApp business account created successfully'
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create business account',
        variant: 'destructive'
      });
    }
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;

    try {
      await updateWhatsAppBusinessAccount(editingAccount.id, {
        name: formData.name,
        access_token: formData.access_token,
        webhook_verify_token: formData.webhook_verify_token,
        is_active: formData.is_active
      });
      
      toast({
        title: 'Success',
        description: 'WhatsApp business account updated successfully'
      });
      
      setIsEditDialogOpen(false);
      setEditingAccount(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update business account',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      business_account_id: '',
      name: '',
      phone_number_id: '',
      access_token: '',
      webhook_verify_token: '',
      org_id: '',
      is_active: true,
      created_by: ''
    });
  };

  const openEditDialog = (account: WhatsAppBusinessAccount) => {
    setEditingAccount(account);
    setFormData({
      business_account_id: account.business_account_id,
      name: account.name,
      phone_number_id: account.phone_number_id,
      access_token: account.access_token,
      webhook_verify_token: account.webhook_verify_token || '',
      org_id: account.org_id || '',
      is_active: account.is_active,
      created_by: account.created_by
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading WhatsApp business accounts...</p>
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
          <h1 className="text-3xl font-bold">WhatsApp Business Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your WhatsApp Business API accounts</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Business Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add WhatsApp Business Account</DialogTitle>
              <DialogDescription>
                Connect your WhatsApp Business API account to start sending messages
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_account_id">Business Account ID</Label>
                  <Input
                    id="business_account_id"
                    value={formData.business_account_id}
                    onChange={(e) => setFormData({ ...formData, business_account_id: e.target.value })}
                    placeholder="Enter Meta Business Account ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter account name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number_id">Phone Number ID</Label>
                  <Input
                    id="phone_number_id"
                    value={formData.phone_number_id}
                    onChange={(e) => setFormData({ ...formData, phone_number_id: e.target.value })}
                    placeholder="Enter WhatsApp Phone Number ID"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="org_id">Organization</Label>
                  <Select value={formData.org_id} onValueChange={(value) => setFormData({ ...formData, org_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="access_token">Access Token</Label>
                <Input
                  id="access_token"
                  type="password"
                  value={formData.access_token}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                  placeholder="Enter WhatsApp Access Token"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook_verify_token">Webhook Verify Token (Optional)</Label>
                <Input
                  id="webhook_verify_token"
                  value={formData.webhook_verify_token}
                  onChange={(e) => setFormData({ ...formData, webhook_verify_token: e.target.value })}
                  placeholder="Enter webhook verify token"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAccount}>
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card key={account.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                </div>
                <Badge variant={account.is_active ? "default" : "secondary"}>
                  {account.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>
                {account.business_account_id}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{account.phone_number_id}</span>
              </div>
              
              {account.org_id && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{organizations.find(org => org.id === account.org_id)?.name || account.org_id}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500">
                  Created: {new Date(account.created_at).toLocaleDateString()}
                </span>
                
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(account)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* TODO: Implement delete */}}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No WhatsApp Business Accounts</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first WhatsApp Business API account
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Business Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit WhatsApp Business Account</DialogTitle>
            <DialogDescription>
              Update your WhatsApp Business API account settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Account Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter account name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_access_token">Access Token</Label>
              <Input
                id="edit_access_token"
                type="password"
                value={formData.access_token}
                onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                placeholder="Enter WhatsApp Access Token"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_webhook_verify_token">Webhook Verify Token</Label>
              <Input
                id="edit_webhook_verify_token"
                value={formData.webhook_verify_token}
                onChange={(e) => setFormData({ ...formData, webhook_verify_token: e.target.value })}
                placeholder="Enter webhook verify token"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAccount}>
              Update Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBusinessAccounts;
