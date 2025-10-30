import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Globe, TestTube } from 'lucide-react';
import { KeyValuePair } from "@/types/campaign";

interface StepPostCallProps {
  form: UseFormReturn<any>;
  categorization: KeyValuePair[];
  setCategorization: React.Dispatch<React.SetStateAction<KeyValuePair[]>>;
  dataExtractionFields: KeyValuePair[];
  setDataExtractionFields: React.Dispatch<React.SetStateAction<KeyValuePair[]>>;
  handleKeyValueChange: (index: number, field: 'key' | 'value', value: string, list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: UseFormReturn<any>, formPath: string) => void;
  handleAddKeyValuePair: (list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: UseFormReturn<any>, formPath: string) => void;
  handleRemoveKeyValuePair: (index: number, list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: UseFormReturn<any>, formPath: string) => void;
  dataExtractionSystemPrompt: string;
  setDataExtractionSystemPrompt: React.Dispatch<React.SetStateAction<string>>;
  categoriesSystemPrompt: string;
  setCategoriesSystemPrompt: React.Dispatch<React.SetStateAction<string>>;
}

// --- Helper to render key-value pairs, skipping system_prompt, empty fields, and non-string values ---
function RenderKeyValueFields(obj: Record<string, any> | undefined) {
  if (!obj) return null;
  const entries = Object.entries(obj).filter(([key, value]) => key !== 'system_prompt' && typeof value === 'string' && value !== undefined && value !== null && value !== '');
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2 items-center">
          <Label className="w-32 text-xs text-gray-500">{key}</Label>
          <Input value={value} readOnly className="h-8 text-xs bg-gray-50" />
        </div>
      ))}
    </div>
  );
}

const StepPostCall = ({
  form,
  categorization,
  setCategorization,
  dataExtractionFields,
  setDataExtractionFields,
  handleKeyValueChange,
  handleAddKeyValuePair,
  handleRemoveKeyValuePair,
  dataExtractionSystemPrompt,
  setDataExtractionSystemPrompt,
  categoriesSystemPrompt,
  setCategoriesSystemPrompt
}: StepPostCallProps) => {
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);

  const testWebhook = async () => {
    const webhookUrl = form.getValues('callback_endpoint');
    if (!webhookUrl) {
      setWebhookTestResult('Please enter a webhook URL first');
      return;
    }

    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const testPayload = {
        event: "test",
        data: {
          call_id: "123e4567-e89b-12d3-a456-426614174000",
          status: "initiated",
          timestamp: new Date().toISOString(),
          test: true
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        const result = await response.json();
        setWebhookTestResult(`✅ Webhook test successful! Response: ${JSON.stringify(result)}`);
      } else {
        setWebhookTestResult(`❌ Webhook test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setWebhookTestResult(`❌ Webhook test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 space-y-3">
        {/* Callback Configuration */}
        <div className="space-y-3">
          {/* New: Method and URL Row */}
          <div className="flex flex-col md:flex-row gap-3 mb-2 items-center">
            <FormField
              control={form.control}
              name="callback_method"
              render={({ field }) => (
                <FormItem className="w-36 min-w-[110px] flex-shrink-0">
                  <FormLabel className="text-sm font-medium text-gray-700">Request Method</FormLabel>
                  <select
                    {...field}
                    className="h-9 w-full rounded border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <FormDescription className="text-xs text-gray-500 mt-1">
                    HTTP method for the callback
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="callback_endpoint"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-sm font-medium text-gray-700">Callback URL</FormLabel>
                  <div className="relative">
                    <Input 
                      {...field} 
                      placeholder="https://platform.voxiflow.com/backend/api/v1/webhook"
                      className="pl-8 h-9 text-sm"
                    />
                    <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <FormDescription className="text-xs text-gray-500 mt-1">
                    The webhook URL that will receive call status updates and post-call data
                  </FormDescription>
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testWebhook}
                disabled={isTestingWebhook}
                className="h-9 px-3 text-xs border-gray-300 hover:bg-gray-50"
              >
                <TestTube className="w-3 h-3 mr-1" />
                {isTestingWebhook ? 'Testing...' : 'Test Webhook'}
              </Button>
            </div>
          </div>
          {webhookTestResult && (
            <div className={`p-2 rounded text-xs ${
              webhookTestResult.startsWith('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {webhookTestResult}
            </div>
          )}
          {/* Auth Token below */}
          <FormField
            control={form.control}
            name="callback_auth_token"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <span>Auth Token</span>
                  <span className="text-xs text-gray-400">(Bearer)</span>
                </FormLabel>
                <div className="relative">
                  <Input
                    {...field}
                    placeholder="Paste Bearer token here"
                    className="pl-8 h-9 text-sm"
                  />
                  <span className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400">
                    <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='currentColor' className='w-4 h-4'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                  </span>
                </div>
                <FormDescription className="text-xs text-gray-500 mt-1">
                  The Bearer token for webhook authentication (optional)
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Categories</h4>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCategorization([...categorization, { key: '', value: '' }]);
                // Also update form value for fields
                const currentFields = form.getValues('post_call_actions.categories.fields') || {};
                form.setValue('post_call_actions.categories.fields', { ...currentFields, '': '' });
              }}
              className="h-7 px-2.5 text-xs font-medium hover:bg-gray-50"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Category
            </Button>
          </div>
          {/* Editable input for system prompt (always shown) */}
          <FormItem className="mb-2">
            <FormLabel className="text-xs text-gray-500">System Prompt (Categories)</FormLabel>
            <FormControl>
              <Input 
                value={categoriesSystemPrompt}
                onChange={(e) => setCategoriesSystemPrompt(e.target.value)}
                className="h-9 text-sm" 
                placeholder="Enter system prompt for categories" 
              />
            </FormControl>
          </FormItem>
          {/* Editable key-value pairs for categories */}
          {categorization.map((pair, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <Input
                value={pair.key}
                onChange={e => {
                  const newList = [...categorization];
                  newList[idx].key = e.target.value;
                  setCategorization(newList);
                  // Update form value
                  const currentFields = form.getValues('post_call_actions.categories.fields') || {};
                  const newFields = { ...currentFields };
                  delete newFields[pair.key];
                  newFields[e.target.value] = pair.value;
                  form.setValue('post_call_actions.categories.fields', newFields);
                }}
                className="h-9 text-sm flex-1"
                placeholder="Key"
              />
              <Input
                value={pair.value}
                onChange={e => {
                  const newList = [...categorization];
                  newList[idx].value = e.target.value;
                  setCategorization(newList);
                  // Update form value
                  const currentFields = form.getValues('post_call_actions.categories.fields') || {};
                  const newFields = { ...currentFields, [pair.key]: e.target.value };
                  form.setValue('post_call_actions.categories.fields', newFields);
                }}
                className="h-9 text-sm flex-1"
                placeholder="Value"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const newList = categorization.filter((_, i) => i !== idx);
                  setCategorization(newList);
                  // Update form value
                  const currentFields = form.getValues('post_call_actions.categories.fields') || {};
                  const newFields = { ...currentFields };
                  delete newFields[pair.key];
                  form.setValue('post_call_actions.categories.fields', newFields);
                }}
                className="h-7 px-2 text-xs font-medium text-red-500 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Data Extraction */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Data Extraction</h4>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDataExtractionFields([...dataExtractionFields, { key: '', value: '' }]);
                // Also update form value for fields
                const currentFields = form.getValues('post_call_actions.data_extracted.fields') || {};
                form.setValue('post_call_actions.data_extracted.fields', { ...currentFields, '': '' });
              }}
              className="h-7 px-2 text-xs font-medium hover:bg-gray-50"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Field
            </Button>
          </div>
          {/* Editable input for system prompt (always shown) */}
          <FormItem className="mb-2">
            <FormLabel className="text-xs text-gray-500">System Prompt (Data Extraction)</FormLabel>
            <FormControl>
              <Input 
                value={dataExtractionSystemPrompt}
                onChange={(e) => setDataExtractionSystemPrompt(e.target.value)}
                className="h-9 text-sm" 
                placeholder="Enter system prompt for data extraction" 
              />
            </FormControl>
          </FormItem>
          {/* Editable key-value pairs for data extraction */}
          {dataExtractionFields.map((pair, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <Input
                value={pair.key}
                onChange={e => {
                  const newList = [...dataExtractionFields];
                  newList[idx].key = e.target.value;
                  setDataExtractionFields(newList);
                  // Update form value
                  const currentFields = form.getValues('post_call_actions.data_extracted.fields') || {};
                  const newFields = { ...currentFields };
                  delete newFields[pair.key];
                  newFields[e.target.value] = pair.value;
                  form.setValue('post_call_actions.data_extracted.fields', newFields);
                }}
                className="h-9 text-sm flex-1"
                placeholder="Key"
              />
              <Input
                value={pair.value}
                onChange={e => {
                  const newList = [...dataExtractionFields];
                  newList[idx].value = e.target.value;
                  setDataExtractionFields(newList);
                  // Update form value
                  const currentFields = form.getValues('post_call_actions.data_extracted.fields') || {};
                  const newFields = { ...currentFields, [pair.key]: e.target.value };
                  form.setValue('post_call_actions.data_extracted.fields', newFields);
                }}
                className="h-9 text-sm flex-1"
                placeholder="Value"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const newList = dataExtractionFields.filter((_, i) => i !== idx);
                  setDataExtractionFields(newList);
                  // Update form value
                  const currentFields = form.getValues('post_call_actions.data_extracted.fields') || {};
                  const newFields = { ...currentFields };
                  delete newFields[pair.key];
                  form.setValue('post_call_actions.data_extracted.fields', newFields);
                }}
                className="h-7 px-2 text-xs font-medium text-red-500 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepPostCall; 