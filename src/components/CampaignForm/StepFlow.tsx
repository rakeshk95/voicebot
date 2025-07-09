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
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 min-h-[400px]">
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
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={contextValue}
                    onChange={(e) => setContextValue(e.target.value)}
                    placeholder="Enter conversation context..."
                    className="min-h-[250px] resize-y bg-gray-50 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-4 text-base shadow-sm transition-all duration-200"
                    style={{ fontFamily: 'inherit', lineHeight: '1.6' }}
                  />
                  <span className="absolute bottom-2 right-4 text-xs text-gray-400 select-none">
                    {contextValue.length} characters
                  </span>
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