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
import { MessageCircle, Variable, Database, Tag, Globe, Mic, Volume2, Clock, Hourglass, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface CampaignDetailsProps {
  campaign: Campaign | null;
}

const CampaignDetails = ({ campaign }: CampaignDetailsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeFlowTab, setActiveFlowTab] = useState<'context' | 'graph' | 'responses' | 'variables' | 'knowledgeBase'>('context');
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    console.log('Campaign data in CampaignDetails:', campaign);
    console.log('LLM data:', campaign?.llm);
    console.log('PromptJson data:', campaign?.llm?.promptJson);
    if (playingUrl && audioRef.current) {
      console.log('Setting audio src and loading:', playingUrl);
      audioRef.current.src = playingUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        console.log('Audio started playing');
      }).catch((err) => {
        setIsPlaying(false);
        console.error('Audio play error:', err);
      });
    }
  }, [campaign, playingUrl]);

  // Stop playing indicator when audio ends or errors
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => { setIsPlaying(false); console.log('Audio ended'); };
    const handleError = () => { setIsPlaying(false); console.log('Audio error'); };
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioRef.current]);

  // Fetch organizations for display
  useEffect(() => {
    fetch('https://platform.voxiflow.com/backend/api/v1/organizations', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
    })
      .then(res => res.json())
      .then(data => setOrganizations(data))
      .catch(() => setOrganizations([]));
  }, []);

  // Fetch voices for display
  useEffect(() => {
    setLoadingVoices(true);
    fetch('https://platform.voxiflow.com/backend/api/v1/voices?voice_ids=XopCoWNooN3d7LfWZyX5,p9aflnsbBe1o0aDeQa97,2bNrEsM0omyhLiEyOwqY,f91ab3e6-5071-4e15-b016-cde6f2bcd222', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'accept': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => setVoices(data))
      .catch(() => setVoices([]))
      .finally(() => setLoadingVoices(false));
  }, []);

  const form = useForm({
    defaultValues: {
      name: campaign?.name || '',
      direction: campaign?.direction || 'OUTBOUND',
      state: campaign?.state || 'TRIAL',
      org_id: campaign?.org_id || '',
      tts: {
        gender: campaign?.tts?.gender || 'female',
        language: campaign?.tts?.language || 'hindi',
        voice_id: campaign?.tts?.voice_id || ''
      },
      telephonic_provider: campaign?.telephonic_provider || '',
      knowledge_base: campaign?.knowledge_base || { url: '', file: null },
      post_call_actions: campaign?.post_call_actions || { categories: {}, data_extracted: {} }
    }
  });

  // Add useEffect to reset playback state on dialog open/close
  useEffect(() => {
    if (!campaign) {
      setPlayingUrl(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      console.log('Dialog closed, audio state reset');
    } else {
      console.log('Dialog opened for campaign', campaign.name);
    }
  }, [campaign]);

  if (!campaign) return null;

  return (
    <div className="space-y-6">
      <audio ref={audioRef} style={{ display: 'block' }} onError={() => toast({ title: 'Playback Error', description: 'Unable to play the audio.', variant: 'destructive' })} />
      {/* Step Indicator */}
      <div className="bg-white rounded-lg p-3 border shadow-sm">
        <div className="flex justify-between">
          {['Name', 'Speech and Call', 'Voice', 'Flow', 'Telephony', 'Post Call Actions'].map((step, index) => (
            <div
              key={step}
              className={`flex flex-col items-center ${
                currentStep === index + 1 ? 'text-primary' : 'text-gray-400'
              }`}
              onClick={() => setCurrentStep(index + 1)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 transition-colors duration-200 ${
                currentStep === index + 1 
                  ? 'bg-primary text-white shadow-sm' 
                  : index + 1 < currentStep 
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-100'
              }`}>
                {index + 1}
              </div>
              <span className="text-xs font-medium">{step}</span>
            </div>
          ))}
        </div>
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
                      <Input value={campaign?.name || ''} disabled className="h-9 bg-white text-gray-900" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">State</div>
                      <Select disabled value={campaign?.state || ''}>
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
                      <div className="text-sm font-medium text-gray-700 mb-1">Organization</div>
                      <Select disabled value={campaign?.org_id || ''}>
                        <SelectTrigger className="h-9 bg-white text-gray-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Speech and Call */}
              {currentStep === 2 && (
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Speech Section */}
                  <div className="flex-1 bg-blue-50/40 rounded p-6 border border-blue-100 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="icon-animate bg-blue-100 p-1 rounded-full"><Mic className="w-5 h-5 text-blue-600" /></span>
                      <h4 className="font-extrabold text-lg text-blue-900 tracking-tight">Speech</h4>
                    </div>
                    <div className="flex flex-col gap-4 pl-6">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-700 font-medium">Allow Interruptions:</span>
                        <span className="ml-2 text-sm font-semibold">{campaign?.speech_setting?.interruption?.status ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-700 font-medium">Ambient Status:</span>
                        <span className="ml-2 text-sm font-semibold">{campaign?.speech_setting?.ambient_sound?.status ? 'On' : 'Off'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Sound:</span>
                        <span className="ml-2 text-sm font-semibold">{campaign?.speech_setting?.ambient_sound?.sound || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Volume:</span>
                        <span className="ml-2 text-sm font-semibold">{campaign?.speech_setting?.ambient_sound?.volume || '-'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Call Section */}
                  <div className="flex-1 bg-blue-50/40 rounded p-6 border border-blue-100 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="icon-animate bg-blue-100 p-1 rounded-full"><Clock className="w-5 h-5 text-blue-600" /></span>
                      <h4 className="font-extrabold text-lg text-blue-900 tracking-tight">Call</h4>
                    </div>
                    <div className="flex flex-col gap-4 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Max idle reminder:</span>
                        <span className="ml-2 text-sm font-semibold">{campaign?.max_idle_reminder || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Max idle duration:</span>
                        <span className="ml-2 text-sm font-semibold">{campaign?.max_idle_duration || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Voice */}
              {currentStep === 3 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
                  {loadingVoices ? (
                    <div className="p-2 text-center text-gray-500">Loading voices...</div>
                  ) : (
                    <table className="w-full min-w-[700px] max-w-full bg-white border border-gray-200 rounded shadow-sm text-sm">
                      <thead>
                        <tr className="bg-blue-700 text-white">
                          <th className="px-2 py-2 text-left font-semibold"> </th>
                          <th className="px-2 py-2 text-left font-semibold">Name</th>
                          <th className="px-2 py-2 text-left font-semibold">Voice Type</th>
                          <th className="px-2 py-2 text-left font-semibold">Gender</th>
                          <th className="px-2 py-2 text-left font-semibold">Country</th>
                          <th className="px-2 py-2 text-left font-semibold">Language</th>
                          <th className="px-2 py-2 text-left font-semibold"> </th>
                        </tr>
                      </thead>
                      <tbody>
                        {voices.filter((voice: any) => campaign?.tts?.voice_id === voice.voice_id).map((voice: any, idx: number) => {
                          const country = voice.locale ? (voice.locale.split('-')[1] || '-') : '-';
                          const languageLabel = voice.language ? voice.language.toUpperCase() : '-';
                          const previewUrl = voice.lang_preview_url || voice.main_preview_url;
                          return (
                            <tr key={voice.voice_id || idx} className="border-b last:border-b-0 bg-blue-50 transition-colors">
                              <td className="px-2 py-2">
                                <button
                                  type="button"
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 relative"
                                  title="Play"
                                  onClick={e => {
                                    e.stopPropagation();
                                    console.log('Play button clicked', previewUrl);
                                    if (previewUrl) {
                                      if (audioRef.current) {
                                        audioRef.current.pause();
                                        audioRef.current.currentTime = 0;
                                      }
                                      setPlayingUrl(previewUrl);
                                    } else {
                                      toast({ title: 'No Preview Available', description: 'No audio preview is available for this voice.', variant: 'destructive' });
                                    }
                                  }}
                                >
                                  <Play className={`w-4 h-4 text-white transition-transform ${isPlaying ? 'animate-spin' : ''}`} />
                                  {isPlaying && <span className="absolute -right-10 text-xs text-blue-600 font-semibold">Playing...</span>}
                                </button>
                              </td>
                              <td className="px-2 py-2 flex items-center gap-2">
                                <span className="font-bold text-gray-800">{voice.name}</span>
                                <Badge className="ml-2 bg-blue-600 text-white">Selected</Badge>
                              </td>
                              <td className="px-2 py-2">
                                <span className="text-blue-500 font-medium">{voice.main_accent || '-'}</span>
                              </td>
                              <td className="px-2 py-2 capitalize text-gray-700">{voice.gender || '-'}</td>
                              <td className="px-2 py-2">{country}</td>
                              <td className="px-2 py-2">{languageLabel}</td>
                              <td className="px-2 py-2 text-center">
                                <span className="ml-2 text-xs text-blue-700 font-semibold">Use voice</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Step 4: Flow */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <Tabs value={activeFlowTab} onValueChange={(value: any) => setActiveFlowTab(value)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="context">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Context
                      </TabsTrigger>
                      <TabsTrigger value="variables">
                        <Variable className="w-4 h-4 mr-2" />
                        Variables
                      </TabsTrigger>
                      <TabsTrigger value="knowledgeBase">
                        <Database className="w-4 h-4 mr-2" />
                        Knowledge Base
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="context" className="space-y-4 mt-4">
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Context</FormLabel>
                        <div className="relative">
                          <Textarea
                            value={campaign?.llm?.promptJson?.context || ''}
                            className="min-h-[200px] bg-white w-full text-gray-900"
                            disabled
                            readOnly
                          />
                          {!campaign?.llm?.promptJson?.context && (
                            <div className="text-sm text-gray-500 italic p-4 bg-white rounded-md">
                              No context defined
                            </div>
                          )}
                        </div>
                      </FormItem>
                    </TabsContent>

                    <TabsContent value="variables" className="space-y-4 mt-4">
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">Prompt Variables</Label>
                        {campaign?.llm?.promptJson?.promptVariables ? (
                          Object.entries(campaign.llm.promptJson.promptVariables).length > 0 ? (
                            Object.entries(campaign.llm.promptJson.promptVariables).map(([key, value], index) => (
                              <div key={index} className="grid grid-cols-2 gap-4">
                                <Input value={key} disabled className="bg-white text-gray-900" readOnly />
                                <Input 
                                  value={typeof value === 'string' ? value : JSON.stringify(value)} 
                                  disabled 
                                  className="bg-white text-gray-900" 
                                  readOnly 
                                />
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 italic p-4 bg-white rounded-md">
                              No variables defined
                            </div>
                          )
                        ) : (
                          <div className="text-sm text-gray-500 italic p-4 bg-white rounded-md">
                            No variables defined
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="knowledgeBase" className="space-y-4 mt-4">
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Knowledge Base URL</FormLabel>
                        <Input
                          value={campaign?.knowledge_base?.url || ''}
                          disabled
                          className="bg-white text-gray-900"
                          readOnly
                        />
                      </FormItem>
                      {campaign?.knowledge_base?.file && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium text-gray-700">Attached File</Label>
                          <div className="mt-2 p-3 bg-white rounded-md border">
                            File attached
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Step 5: Telephony */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Direction</FormLabel>
                        <Select disabled value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-white text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INBOUND">Inbound</SelectItem>
                            <SelectItem value="OUTBOUND">Outbound</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telephonic_provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Telephony Provider</FormLabel>
                        <Select disabled value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-white text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="exotel">Exotel</SelectItem>
                            <SelectItem value="twilio">Twilio</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 6: Post Call Actions */}
              {currentStep === 6 && (
                <div className="space-y-6">
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
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CampaignDetails; 