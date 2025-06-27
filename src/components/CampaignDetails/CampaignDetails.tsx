import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campaign } from "@/types/campaign";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Variable, Database, Tag, Globe } from 'lucide-react';

interface CampaignDetailsProps {
  campaign: Campaign | null;
}

const CampaignDetails = ({ campaign }: CampaignDetailsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activeFlowTab, setActiveFlowTab] = useState<'context' | 'graph' | 'responses' | 'variables' | 'knowledgeBase'>('context');

  useEffect(() => {
    console.log('Campaign data in CampaignDetails:', campaign);
    console.log('LLM data:', campaign?.llm);
    console.log('PromptJson data:', campaign?.llm?.promptJson);
  }, [campaign]);

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

  if (!campaign) return null;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="bg-white rounded-lg p-3 border shadow-sm">
        <div className="flex justify-between">
          {['Language', 'Voice', 'Flow', 'Telephony', 'Post Call Actions'].map((step, index) => (
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
              {/* Step 1: Language */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Campaign Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="h-9 bg-white text-gray-900" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tts.language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Language</FormLabel>
                        <Select disabled value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-white text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hindi">Hindi</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">State</FormLabel>
                        <Select disabled value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-white text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="TRIAL">Trial</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="org_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Organization</FormLabel>
                        <Input value={field.value} disabled className="h-9 bg-white text-gray-900" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Voice */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tts.gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Voice Gender</FormLabel>
                        <Select disabled value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 bg-white text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tts.voice_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Voice ID</FormLabel>
                        <Input {...field} disabled className="h-9 bg-white text-gray-900" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Flow */}
              {currentStep === 3 && (
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

              {/* Step 4: Telephony */}
              {currentStep === 4 && (
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

              {/* Step 5: Post Call Actions */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Categories</h3>
                    <div className="space-y-4">
                      {campaign.post_call_actions?.categories && 
                        Object.entries(campaign.post_call_actions.categories).map(([key, value], index) => (
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
                      {campaign.post_call_actions?.data_extracted && 
                        Object.entries(campaign.post_call_actions.data_extracted).map(([key, value], index) => (
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