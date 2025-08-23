import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface StepTelephonyProps {
  form: UseFormReturn<any>;
}

const StepTelephony = ({ form }: StepTelephonyProps) => {
  const [selectedLLMProvider, setSelectedLLMProvider] = useState<string>('');
  const [selectedSTTVendor, setSelectedSTTVendor] = useState<string>('');
  
  // Debug: Log form values
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('llm.')) {
        console.log('StepTelephony: LLM form values changed:', value.llm);
      }
      if (name?.startsWith('stt.')) {
        console.log('StepTelephony: STT form values changed:', value.stt);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Get available STT models based on STT vendor
  const getSTTModels = (sttVendor: string) => {
    console.log('getSTTModels called with vendor:', sttVendor);
    switch (sttVendor.toLowerCase()) {
      case 'google':
        return [
          { value: 'google-speech', label: 'Google Speech' },
          { value: 'google-speech-v2', label: 'Google Speech V2' },
          { value: 'google-speech-advanced', label: 'Google Speech Advanced' }
        ];
      case 'whisper':
      case 'openai':
        return [
          { value: 'whisper-1', label: 'Whisper-1' },
          { value: 'whisper-large-v3', label: 'Whisper Large V3' },
          { value: 'whisper-turbo', label: 'Whisper Turbo' }
        ];
      case 'anthropic':
        return [
          { value: 'claude-sonnet', label: 'Claude Sonnet' },
          { value: 'claude-opus', label: 'Claude Opus' },
          { value: 'claude-haiku', label: 'Claude Haiku' }
        ];
      case 'azure':
        return [
          { value: 'azure-cognitive', label: 'Azure Cognitive' },
          { value: 'azure-speech', label: 'Azure Speech' }
        ];
      case 'aws':
        return [
          { value: 'amazon-transcribe', label: 'Amazon Transcribe' },
          { value: 'amazon-transcribe-medical', label: 'Amazon Transcribe Medical' }
        ];
      case 'deepgram':
        return [
          { value: 'nova-2', label: 'Nova-2' },
          { value: 'nova-2-exp', label: 'Nova-2 Experimental' },
          { value: 'enhanced', label: 'Enhanced' }
        ];
      default:
        return [
          { value: 'nova-2', label: 'Nova-2 (Deepgram)' },
          { value: 'whisper-1', label: 'Whisper-1 (OpenAI)' },
          { value: 'whisper-large-v3', label: 'Whisper Large V3' },
          { value: 'google-speech', label: 'Google Speech' },
          { value: 'azure-cognitive', label: 'Azure Cognitive' }
        ];
    }
  };

  // Get available LLM models based on provider
  const getLLMModels = (provider: string) => {
    console.log('getLLMModels called with provider:', provider);
    switch (provider.toLowerCase()) {
      case 'openai':
        return [
          { value: 'gpt-4.1', label: 'GPT-4.1' },
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
          { value: 'gpt-4', label: 'GPT-4' }
        ];
      case 'gemini':
        return [
          { value: 'gemini-pro', label: 'Gemini Pro' },
          { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' },
          { value: 'gemini-flash', label: 'Gemini Flash' }
        ];
      case 'anthropic':
        return [
          { value: 'claude-3-opus', label: 'Claude 3 Opus' },
          { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
          { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
        ];
      case 'azure':
        return [
          { value: 'gpt-4', label: 'GPT-4 (Azure)' },
          { value: 'gpt-35-turbo', label: 'GPT-3.5 Turbo (Azure)' }
        ];
      case 'aws':
        return [
          { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet (AWS)' },
          { value: 'claude-3-haiku', label: 'Claude 3 Haiku (AWS)' },
          { value: 'llama-2-70b', label: 'Llama 2 70B' }
        ];
      default:
        return [
          { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
          { value: 'gemini-pro', label: 'Gemini Pro (Google)' },
          { value: 'claude-3-opus', label: 'Claude 3 Opus (Anthropic)' }
        ];
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 space-y-6">
        {/* Telephony Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Telephony Configuration</h3>
          
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INBOUND">Inbound</SelectItem>
                    <SelectItem value="OUTBOUND">Outbound</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="telephonic_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Telephony Provider</FormLabel>
                <Select
                  onValueChange={val => field.onChange(val.toLowerCase())}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="czentrix">Czentrix</SelectItem>
                    <SelectItem value="exotel">Exotel</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="servotel">ServoTel</SelectItem>
                    <SelectItem value="plivo">Plivo</SelectItem>
                    <SelectItem value="sampark">Sampark</SelectItem>
                    <SelectItem value="smallestai">SmallestAI</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          {/* Telephony Configuration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="telephony_config.channels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Number of Channels</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      className="h-9"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          field.onChange(0);
                        } else {
                          const numValue = parseInt(value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }
                      }}
                      value={field.value === 0 ? '' : field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telephony_config.max_concurrent_calls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Max Concurrent Calls</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="1"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      value={field.value || 1}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telephony_config.call_timeout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Call Timeout (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="30"
                      max="3600"
                      placeholder="30"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                      value={field.value || 30}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* STT Configuration */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Speech-to-Text (STT) Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="stt.vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">STT Provider</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedSTTVendor(value);
                      // Reset STT model when vendor changes
                      form.setValue('stt.provider', '');
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select STT provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="deepgram">Deepgram</SelectItem>
                      <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                      <SelectItem value="google">Google Speech-to-Text</SelectItem>
                      <SelectItem value="azure">Azure Speech Services</SelectItem>
                      <SelectItem value="aws">Amazon Transcribe</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stt.provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">STT Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select STT model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getSTTModels(form.watch('stt.vendor') || selectedSTTVendor).map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="border-t pt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Large Language Model (LLM) Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="llm.provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">LLM Provider</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      console.log('LLM Provider selected:', value);
                      field.onChange(value);
                      setSelectedLLMProvider(value);
                      // Reset LLM model when provider changes
                      form.setValue('llm.model', '');
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select LLM provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="azure">Azure OpenAI</SelectItem>
                      <SelectItem value="aws">AWS Bedrock</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="llm.model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">LLM Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select LLM model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getLLMModels(form.watch('llm.provider') || selectedLLMProvider).map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepTelephony; 