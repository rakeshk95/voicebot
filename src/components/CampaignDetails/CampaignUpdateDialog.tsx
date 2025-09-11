import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Save, 
  X, 
  MessageCircle, 
  Mic, 
  Settings,
  Database,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  updateCampaignWithVersioning, 
  CampaignUpdateRequest, 
  CampaignVersion 
} from '@/lib/campaignVersioningApi';
import { Campaign } from '@/types/campaign';

interface CampaignUpdateDialogProps {
  campaign: Campaign;
  onUpdate: (updatedCampaign: Campaign) => void;
  children?: React.ReactNode;
}

export const CampaignUpdateDialog: React.FC<CampaignUpdateDialogProps> = ({ 
  campaign, 
  onUpdate, 
  children 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [updateData, setUpdateData] = useState<CampaignUpdateRequest>({
    name: campaign.name,
    state: campaign.state,
    llm: campaign.llm,
    tts: campaign.tts,
    speech_setting: campaign.speech_setting,
    telephonic_provider: campaign.telephonic_provider,
    knowledge_base: campaign.knowledge_base,
    post_call_actions: campaign.post_call_actions,
  });
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!changeReason.trim()) {
      toast({
        title: "Change Reason Required",
        description: "Please provide a reason for this update.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await updateCampaignWithVersioning(
        campaign.id, 
        updateData, 
        changeReason
      );
      
      toast({
        title: "Campaign Updated",
        description: `Campaign updated successfully. New version ${result.new_version} created.`,
      });
      
      onUpdate(result.campaign);
      setOpen(false);
      setChangeReason('');
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      updateData.name !== campaign.name ||
      updateData.state !== campaign.state ||
      JSON.stringify(updateData.llm) !== JSON.stringify(campaign.llm) ||
      JSON.stringify(updateData.tts) !== JSON.stringify(campaign.tts) ||
      JSON.stringify(updateData.speech_setting) !== JSON.stringify(campaign.speech_setting) ||
      updateData.telephonic_provider !== campaign.telephonic_provider ||
      JSON.stringify(updateData.knowledge_base) !== JSON.stringify(campaign.knowledge_base) ||
      JSON.stringify(updateData.post_call_actions) !== JSON.stringify(campaign.post_call_actions)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            Update Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Update Campaign - Version {campaign.version}
          </DialogTitle>
          <DialogDescription>
            Update the campaign settings. A new version will be created with your changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Change Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Change Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe the changes you're making and why..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Update Form */}
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="llm">LLM Settings</TabsTrigger>
              <TabsTrigger value="tts">Voice Settings</TabsTrigger>
              <TabsTrigger value="other">Other Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      value={updateData.name || ''}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={updateData.state || ''}
                      onValueChange={(value) => setUpdateData(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="llm" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    LLM Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="llm-model">Model</Label>
                    <Input
                      id="llm-model"
                      value={updateData.llm?.model || ''}
                      onChange={(e) => setUpdateData(prev => ({
                        ...prev,
                        llm: { ...prev.llm, model: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="llm-prompt">Prompt</Label>
                    <Textarea
                      id="llm-prompt"
                      value={updateData.llm?.prompt || ''}
                      onChange={(e) => setUpdateData(prev => ({
                        ...prev,
                        llm: { ...prev.llm, prompt: e.target.value }
                      }))}
                      className="min-h-[150px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Voice Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tts-gender">Gender</Label>
                      <Select
                        value={updateData.tts?.gender || ''}
                        onValueChange={(value) => setUpdateData(prev => ({
                          ...prev,
                          tts: { ...prev.tts, gender: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tts-language">Language</Label>
                      <Input
                        id="tts-language"
                        value={updateData.tts?.language || ''}
                        onChange={(e) => setUpdateData(prev => ({
                          ...prev,
                          tts: { ...prev.tts, language: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tts-voice-id">Voice ID</Label>
                    <Input
                      id="tts-voice-id"
                      value={updateData.tts?.voice_id || ''}
                      onChange={(e) => setUpdateData(prev => ({
                        ...prev,
                        tts: { ...prev.tts, voice_id: e.target.value }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="other" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Other Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="telephonic-provider">Telephony Provider</Label>
                    <Select
                      value={updateData.telephonic_provider || ''}
                      onValueChange={(value) => setUpdateData(prev => ({ ...prev, telephonic_provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="czentrix">Czentrix</SelectItem>
                        <SelectItem value="exotel">Exotel</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="servotel">ServoTel</SelectItem>
                        <SelectItem value="plivo">Plivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              {hasChanges() ? (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Changes detected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  No changes
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={loading || !hasChanges() || !changeReason.trim()}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignUpdateDialog;
