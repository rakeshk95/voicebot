import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campaign, Organization } from "@/types/campaign";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Variable, Database, Tag, Globe, Mic, Volume2, Clock, Hourglass, Play, History, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CampaignVersionHistory from './CampaignVersionHistory';
import CampaignUpdateDialog from './CampaignUpdateDialog';
import { config } from '@/config/env';

interface CampaignDetailsProps {
  campaign: Campaign | null;
  onUpdate?: (updatedCampaign: Campaign) => void;
}

const CampaignDetails = ({ campaign, onUpdate }: CampaignDetailsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeFlowTab, setActiveFlowTab] = useState<'context' | 'graph' | 'responses' | 'variables' | 'knowledgeBase'>('context');
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [voices, setVoices] = useState<any[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    if (playingUrl && audioRef.current) {
      audioRef.current.src = playingUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Error playing audio:', error);
        toast({
          title: "Error",
          description: "Failed to play audio",
          variant: "destructive"
        });
      });
    }
  }, [playingUrl, toast]);

  // Load organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      setLoadingOrganizations(true);
      try {
        const response = await fetch(`${config.apiBaseUrl}/organizations`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Organizations loaded:', data);
          setOrganizations(data);
        } else {
          console.error('Failed to load organizations:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setLoadingOrganizations(false);
      }
    };
    loadOrganizations();
  }, []);

  // Load voices
  const loadVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/voices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVoices(data);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    } finally {
      setLoadingVoices(false);
    }
  };

  const form = useForm({
    defaultValues: {
      campaign_id: campaign?.id || '',
      name: campaign?.name || '',
      direction: campaign?.direction || 'OUTBOUND',
      state: campaign?.state || 'TRIAL',
      org_id: campaign?.org_id || '',
      tts: campaign?.tts || { gender: 'female', language: 'hindi', voice_id: 'hi-IN-AnanyaNeural' },
      stt: (campaign as any)?.stt || { vendor: 'deepgram', provider: 'nova-2' },
      telephonic_provider: campaign?.telephonic_provider || 'czentrix',
      telephony_config: (campaign as any)?.telephony_config || { channels: 1, max_concurrent_calls: 1, call_timeout: 30 },
      knowledge_base: campaign?.knowledge_base || { url: '', file: null },
      post_call_actions: campaign?.post_call_actions,
      callback_endpoint: (campaign as any)?.callback_endpoint || '',
      llm: campaign?.llm || {
        provider: 'AZURE',
        model: 'gpt-4.1',
        temperature: '0.5',
        maxCallDuration: '300',
        useEmbeddings: false,
        prompt: '',
        promptJson: {
          skeleton: 'Simple output format.',
          promptVariables: {},
          knowledgeBase: { url: '', file: null },
          nodes: {},
          context: '',
          botStateDefinitions: {},
          language: 'hindi',
          mermaidGraph: 'initial_message -->|edge| node1\nnode1 -->|edge| node2'
        }
      }
    }
  });

  const steps = [
    'Name',
    'Speech & Call',
    'Voice',
    'Flow',
    'Telephony',
    'Post Call Actions',
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handlePlayAudio = (url: string) => {
    if (isPlaying && playingUrl === url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setPlayingUrl(null);
    } else {
      setPlayingUrl(url);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlayingUrl(null);
  };

  const getOrganizationName = (orgId: string) => {
    if (loadingOrganizations) {
      return 'Loading...';
    }
    console.log('Looking for organization:', orgId);
    console.log('Available organizations:', organizations);
    const org = organizations.find(o => o.id === orgId);
    console.log('Found organization:', org);
    return org ? org.name : orgId;
  };

  const getVoiceName = (voiceId: string) => {
    const voice = voices.find(v => v.voice_id === voiceId);
    return voice ? voice.name : voiceId;
  };

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No campaign selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
            <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{campaign.name}</h2>
          <p className="text-sm text-gray-500">Campaign ID: {campaign.id}</p>
                </div>
        <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
            onClick={() => setShowVersionHistory(true)}
            className="flex items-center gap-2"
                >
            <History className="h-4 w-4" />
            Version History
                </Button>
          <CampaignUpdateDialog campaign={campaign} onUpdate={onUpdate || (() => {})} />
              </div>
            </div>

      {/* Stepper */}
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === index + 1
                  ? 'bg-blue-600 text-white'
                  : currentStep > index + 1
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
                {index + 1}
              </div>
            <span className={`ml-2 text-sm ${
              currentStep === index + 1 ? 'text-blue-600 font-medium' : 'text-gray-500'
            }`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-4 ${
                currentStep > index + 1 ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
            </div>
          ))}
      </div>

      <Form {...form}>
        <form className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm min-h-[350px]">
            <div className="p-4">
              {/* Step 1: Name */}
              {currentStep === 1 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 space-y-4 min-h-[400px]">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Campaign Name</div>
                      <Input value={campaign.name} disabled className="h-9 bg-white text-gray-900" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">State</div>
                      <Select disabled value={campaign.state}>
                            <SelectTrigger className="h-9 bg-white text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRIAL">Trial</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Direction</div>
                      <Select disabled value={campaign.direction}>
                        <SelectTrigger className="h-9 bg-white text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INBOUND">Inbound</SelectItem>
                          <SelectItem value="OUTBOUND">Outbound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Organization</div>
                      <Input value={getOrganizationName(campaign.org_id)} disabled className="h-9 bg-white text-gray-900" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Speech & Call */}
              {currentStep === 2 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 space-y-4 min-h-[400px]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Allow Interruptions</div>
                        <Select disabled value={(campaign as any).allow_interruption ? 'true' : 'false'}>
                          <SelectTrigger className="h-9 bg-white text-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Ambient Sound</div>
                        <Select disabled value={campaign.speech_setting?.ambient_sound?.status ? 'true' : 'false'}>
                          <SelectTrigger className="h-9 bg-white text-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Enabled</SelectItem>
                            <SelectItem value="false">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {campaign.speech_setting?.ambient_sound?.status && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Sound Type</div>
                          <Input value={campaign.speech_setting.ambient_sound.sound} disabled className="h-9 bg-white text-gray-900" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Volume</div>
                          <Input value={campaign.speech_setting.ambient_sound.volume} disabled className="h-9 bg-white text-gray-900" />
                  </div>
                    </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Max Idle Reminder</div>
                        <Input value={campaign.max_idle_reminder} disabled className="h-9 bg-white text-gray-900" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Max Idle Duration</div>
                        <Input value={campaign.max_idle_duration} disabled className="h-9 bg-white text-gray-900" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Voice */}
              {currentStep === 3 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 space-y-4 min-h-[400px]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Gender</div>
                        <Input value={campaign.tts?.gender} disabled className="h-9 bg-white text-gray-900" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Language</div>
                        <Input value={campaign.tts?.language} disabled className="h-9 bg-white text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Voice ID</div>
                      <Input value={campaign.tts?.voice_id} disabled className="h-9 bg-white text-gray-900" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Voice Name</div>
                      <Input value={getVoiceName(campaign.tts?.voice_id || '')} disabled className="h-9 bg-white text-gray-900" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Vendor</div>
                      <Input value={(campaign.tts as any)?.vendor} disabled className="h-9 bg-white text-gray-900" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Flow */}
              {currentStep === 4 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 space-y-4 min-h-[400px]">
                    <Tabs value={activeFlowTab} onValueChange={(value: any) => setActiveFlowTab(value)} className="w-full">
                      <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-md">
                        <TabsTrigger value="context" className="text-sm">Context</TabsTrigger>
                        <TabsTrigger value="graph" className="text-sm">Graph</TabsTrigger>
                        <TabsTrigger value="responses" className="text-sm">Responses</TabsTrigger>
                        <TabsTrigger value="variables" className="text-sm">Variables</TabsTrigger>
                        <TabsTrigger value="knowledgeBase" className="text-sm">Knowledge Base</TabsTrigger>
                    </TabsList>

                      <div className="mt-4">
                        <TabsContent value="context">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Context</Label>
                          <Textarea
                              value={campaign.llm?.promptJson?.context || ''}
                            disabled
                              className="min-h-[200px] bg-white text-gray-900"
                              placeholder="Enter conversation context..."
                          />
                        </div>
                    </TabsContent>

                        <TabsContent value="responses">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Responses</Label>
                            {(campaign.llm?.promptJson as any)?.responses && Object.keys((campaign.llm.promptJson as any).responses).length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries((campaign.llm.promptJson as any).responses).map(([key, value], index) => (
                              <div key={index} className="grid grid-cols-2 gap-4">
                                    <Input value={key} disabled className="bg-white text-gray-900" />
                                    <Input value={value as string} disabled className="bg-white text-gray-900" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No responses defined</p>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="variables">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Variables</Label>
                            {campaign.llm?.promptJson?.promptVariables && Object.keys(campaign.llm.promptJson.promptVariables).length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries(campaign.llm.promptJson.promptVariables).map(([key, value], index) => (
                                  <div key={index} className="grid grid-cols-2 gap-4">
                                    <Input value={key} disabled className="bg-white text-gray-900" />
                                    <Input value={value as string} disabled className="bg-white text-gray-900" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No variables defined</p>
                        )}
                      </div>
                    </TabsContent>

                        <TabsContent value="knowledgeBase">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Knowledge Base URL</Label>
                            <Input value={campaign.knowledge_base?.url || ''} disabled className="bg-white text-gray-900" />
                          </div>
                        </TabsContent>

                        <TabsContent value="graph">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Mermaid Graph</Label>
                            <Textarea
                              value={(campaign.llm?.promptJson as any)?.mermaidGraph || ''}
                              disabled
                              className="min-h-[200px] bg-white text-gray-900"
                              placeholder="Mermaid graph definition..."
                            />
                          </div>
                        </TabsContent>
                        </div>
                  </Tabs>
                  </div>
                </div>
              )}

              {/* Step 5: Telephony */}
              {currentStep === 5 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 space-y-4 min-h-[400px]">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Telephonic Provider</div>
                      <Input value={campaign.telephonic_provider} disabled className="h-9 bg-white text-gray-900" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Channels</div>
                        <Input value={(campaign as any).telephony_config?.channels} disabled className="h-9 bg-white text-gray-900" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Max Concurrent Calls</div>
                        <Input value={(campaign as any).telephony_config?.max_concurrent_calls} disabled className="h-9 bg-white text-gray-900" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Call Timeout</div>
                        <Input value={(campaign as any).telephony_config?.call_timeout} disabled className="h-9 bg-white text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Callback Endpoint</div>
                      <Input value={(campaign as any).callback_endpoint || ''} disabled className="h-9 bg-white text-gray-900" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Post Call Actions */}
              {currentStep === 6 && (
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 space-y-4 min-h-[400px]">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Categories</h3>
                    <div className="space-y-4">
                      {campaign.post_call_actions?.categories?.system_prompt && (
                        <div className="grid grid-cols-2 gap-4">
                          <Input value="system_prompt" disabled className="bg-white text-gray-900" />
                          <Input value={campaign.post_call_actions.categories.system_prompt} disabled className="bg-white text-gray-900" />
                        </div>
                      )}
                      {campaign.post_call_actions?.categories?.fields && Object.keys(campaign.post_call_actions.categories.fields).length > 0 &&
                        Object.entries(campaign.post_call_actions.categories.fields).map(([key, value], index) => (
                          <div key={index} className="grid grid-cols-2 gap-4">
                            <Input value={key} disabled className="bg-white text-gray-900" />
                            <Input value={value as string} disabled className="bg-white text-gray-900" />
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Data Extraction</h3>
                    <div className="space-y-4">
                      {campaign.post_call_actions?.data_extracted?.system_prompt && (
                        <div className="grid grid-cols-2 gap-4">
                          <Input value="system_prompt" disabled className="bg-white text-gray-900" />
                          <Input value={campaign.post_call_actions.data_extracted.system_prompt} disabled className="bg-white text-gray-900" />
                        </div>
                      )}
                      {campaign.post_call_actions?.data_extracted?.fields && Object.keys(campaign.post_call_actions.data_extracted.fields).length > 0 &&
                        Object.entries(campaign.post_call_actions.data_extracted.fields).map(([key, value], index) => (
                          <div key={index} className="grid grid-cols-2 gap-4">
                            <Input value={key} disabled className="bg-white text-gray-900" />
                            <Input value={value as string} disabled className="bg-white text-gray-900" />
                          </div>
                        ))
                      }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Form>

      {/* Audio Player */}
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          setPlayingUrl(null);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Version History Dialog */}
      {showVersionHistory && (
        <CampaignVersionHistory
          campaignId={campaign.id}
        />
      )}
    </div>
  );
};

export default CampaignDetails; 
