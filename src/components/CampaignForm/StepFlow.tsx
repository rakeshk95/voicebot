import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Upload } from 'lucide-react';
import { KeyValuePair } from "@/types/campaign";
import ReactQuill from 'react-quill';
import "quill/dist/quill.snow.css";
// @ts-ignore
// eslint-disable-next-line
import type {} from 'react-quill';

interface StepFlowProps {
  form: UseFormReturn<any>;
  activeFlowTab: 'context' | 'graph' | 'responses' | 'variables' | 'knowledgeBase';
  setActiveFlowTab: React.Dispatch<React.SetStateAction<'context' | 'graph' | 'responses' | 'variables' | 'knowledgeBase'>>;
  contextValue: string;
  setContextValue: (value: string) => void;
  responses: KeyValuePair[];
  setResponses: React.Dispatch<React.SetStateAction<KeyValuePair[]>>;
  variables: KeyValuePair[];
  setVariables: React.Dispatch<React.SetStateAction<KeyValuePair[]>>;
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  handleKeyValueChange: (index: number, field: 'key' | 'value', value: string, list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: UseFormReturn<any>, formPath: string) => void;
  handleAddKeyValuePair: (list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: UseFormReturn<any>, formPath: string) => void;
  handleRemoveKeyValuePair: (index: number, list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: UseFormReturn<any>, formPath: string) => void;
}

const StepFlow = ({
  form,
  activeFlowTab,
  setActiveFlowTab,
  contextValue,
  setContextValue,
  responses,
  setResponses,
  variables,
  setVariables,
  selectedFile,
  setSelectedFile,
  handleKeyValueChange,
  handleAddKeyValuePair,
  handleRemoveKeyValuePair
}: StepFlowProps) => {
  const [initialType, setInitialType] = React.useState<'dynamic' | 'custom'>(
    (form.getValues('llm.initialMessage') ? 'custom' : 'dynamic')
  );
  const [customInitial, setCustomInitial] = React.useState<string>(form.getValues('llm.initialMessage') || '');

  // Generate a dynamic initial message from variables/context
  const buildDynamicInitial = React.useCallback(() => {
    const pv: Record<string, string> = form.getValues('llm.promptJson.promptVariables') || {};
    const keys = Object.keys(pv);
    const hasName = keys.includes('customer_name') || keys.includes('caller_name') || keys.includes('name');
    const hasDate = keys.includes('date');
    const hasTime = keys.includes('time');
    const greet = 'Hello' + (hasName ? ` {${keys.includes('customer_name') ? 'customer_name' : keys.includes('caller_name') ? 'caller_name' : 'name'}}` : '') + ',';
    const purpose = 'this is an automated reminder to assist you.';
    const schedule = hasDate || hasTime
      ? ` Your appointment is${hasDate ? ' on {date}' : ''}${hasTime ? (hasDate ? ' at {time}' : ' at {time}') : ''}.`
      : '';
    const contextHint = (contextValue || '').trim() ? ' ' + 'I will share some details now.' : '';
    return `${greet} ${purpose}${schedule}${contextHint}`.trim();
  }, [form, contextValue]);

  // Keep form.llm.initialMessage in sync based on type
  React.useEffect(() => {
    const value = initialType === 'dynamic' ? buildDynamicInitial() : customInitial;
    form.setValue('llm.initialMessage', value || '');
  }, [initialType, customInitial, buildDynamicInitial, form]);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 h-[60vh] flex flex-col">
        <Tabs value={activeFlowTab} onValueChange={(value: any) => setActiveFlowTab(value)} className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-md">
            <TabsTrigger value="context" className="text-sm">Context</TabsTrigger>
            <TabsTrigger value="graph" className="text-sm">Graph</TabsTrigger>
            <TabsTrigger value="responses" className="text-sm">Responses</TabsTrigger>
            <TabsTrigger value="variables" className="text-sm">Variables</TabsTrigger>
            <TabsTrigger value="knowledgeBase" className="text-sm">Knowledge Base</TabsTrigger>
          </TabsList>

          <div className="mt-1 flex-1 flex flex-col">
            <TabsContent value="context">
              {/* Initial Message selector (compact) */}
              <div className="mb-2 p-2 rounded-lg border border-gray-200 bg-white/70">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-gray-800">Initial Message</div>
                  <div className="flex gap-1 bg-gray-50 rounded-full border px-1 py-[2px]">
                    <button
                      type="button"
                      onClick={() => setInitialType('dynamic')}
                      className={`px-1 py-1 text-xs rounded-full ${initialType==='dynamic' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >Dynamic</button>
                    <button
                      type="button"
                      onClick={() => setInitialType('custom')}
                      className={`px-3 py-1 text-xs rounded-full ${initialType==='custom' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >Custom</button>
                  </div>
                </div>
                {initialType === 'dynamic' ? (
                  <div className="mt-1 text-sm">
                    <Input
                      readOnly
                      value={buildDynamicInitial()}
                      className="h-8 bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="mt-1 text-[11px] text-gray-500">Automatically crafted from current variables and context.</div>
                  </div>
                ) : (
                  <div className="mt-1">
                    <Input
                      value={customInitial}
                      onChange={(e) => setCustomInitial(e.target.value)}
                      placeholder="Type the first line your agent should speak..."
                      className="h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="rounded-lg border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
                <ReactQuill
                  value={contextValue}
                  onChange={setContextValue}
                  theme="snow"
                  style={{ height: '36vh', minHeight: 220 }}
                  placeholder="Enter conversation context..."
                  modules={{
                    toolbar: [
                      [{ 'font': [] }, { 'size': [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'script': 'sub'}, { 'script': 'super' }],
                      ['blockquote', 'code-block'],
                      [{ 'header': 1 }, { 'header': 2 }, 'link', 'image'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['clean']
                    ]
                  }}
                />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="responses">
              <div className="space-y-4">
                {responses.map((response, index) => (
                  <div key={index} className="flex gap-3">
                    <Input
                      value={response.key}
                      onChange={(e) => handleKeyValueChange(index, 'key', e.target.value, responses, setResponses, form, 'llm.promptJson.responses')}
                      placeholder="Response key"
                      className="h-9"
                    />
                    <Input
                      value={response.value}
                      onChange={(e) => handleKeyValueChange(index, 'value', e.target.value, responses, setResponses, form, 'llm.promptJson.responses')}
                      placeholder="Response value"
                      className="h-9"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveKeyValuePair(index, responses, setResponses, form, 'llm.promptJson.responses')}
                      className="h-9 w-9 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddKeyValuePair(responses, setResponses, form, 'llm.promptJson.responses')}
                  className="w-full h-9"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Response
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="variables">
              <div className="space-y-4">
                {variables.map((variable, index) => (
                  <div key={index} className="flex gap-3">
                    <Input
                      value={variable.key}
                      onChange={(e) => handleKeyValueChange(index, 'key', e.target.value, variables, setVariables, form, 'llm.promptJson.promptVariables')}
                      placeholder="Variable key"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={variable.value}
                      onChange={(e) => handleKeyValueChange(index, 'value', e.target.value, variables, setVariables, form, 'llm.promptJson.promptVariables')}
                      placeholder="Variable value"
                      className="h-9 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveKeyValuePair(index, variables, setVariables, form, 'llm.promptJson.promptVariables')}
                      className="h-9 w-9 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddKeyValuePair(variables, setVariables, form, 'llm.promptJson.promptVariables')}
                  className="w-full h-9"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="knowledgeBase">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="knowledge_base.url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Knowledge Base URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter knowledge base URL" className="h-9" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Upload Knowledge Base File</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-50/50">
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          form.setValue('knowledge_base.file', file);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default StepFlow; 
