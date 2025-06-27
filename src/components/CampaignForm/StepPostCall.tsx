import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Globe } from 'lucide-react';
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
}

const StepPostCall = ({
  form,
  categorization,
  setCategorization,
  dataExtractionFields,
  setDataExtractionFields,
  handleKeyValueChange,
  handleAddKeyValuePair,
  handleRemoveKeyValuePair
}: StepPostCallProps) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 space-y-4 min-h-[400px]">
        {/* Callback Configuration */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="callback_endpoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Callback URL</FormLabel>
                <div className="relative">
                  <Input 
                    {...field} 
                    placeholder="https://your-callback-url.com/webhook"
                    className="pl-8 h-9 text-sm"
                  />
                  <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                </div>
                <FormDescription className="text-xs text-gray-500 mt-1">
                  The webhook URL that will receive post-call data
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
              }}
              className="h-7 px-2.5 text-xs font-medium hover:bg-gray-50"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Category
            </Button>
          </div>
          <div className="space-y-2">
            {categorization.map((category, index) => (
              <div key={index} className="group flex items-center gap-3">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <Input
                    value={category.key}
                    onChange={(e) => {
                      const newCategories = [...categorization];
                      newCategories[index].key = e.target.value;
                      setCategorization(newCategories);
                      const formValue = {};
                      newCategories.forEach(cat => {
                        formValue[cat.key] = cat.value;
                      });
                      form.setValue('post_call_actions.categories', formValue);
                    }}
                    placeholder="Category name"
                    className="h-9 text-sm"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={category.value}
                      onChange={(e) => {
                        const newCategories = [...categorization];
                        newCategories[index].value = e.target.value;
                        setCategorization(newCategories);
                        const formValue = {};
                        newCategories.forEach(cat => {
                          formValue[cat.key] = cat.value;
                        });
                        form.setValue('post_call_actions.categories', formValue);
                      }}
                      placeholder="Description"
                      className="h-9 text-sm flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        const newCategories = categorization.filter((_, i) => i !== index);
                        setCategorization(newCategories);
                        const formValue = {};
                        newCategories.forEach(cat => {
                          formValue[cat.key] = cat.value;
                        });
                        form.setValue('post_call_actions.categories', formValue);
                      }}
                      className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Extraction */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Data Extraction</h4>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleAddKeyValuePair(dataExtractionFields, setDataExtractionFields, form, 'post_call_actions.data_extracted')}
              className="h-7 px-2 text-xs font-medium hover:bg-gray-50"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Field
            </Button>
          </div>
          <div className="space-y-2">
            {dataExtractionFields.map((field, index) => (
              <div key={index} className="group flex items-center gap-3">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <Input
                    value={field.key}
                    onChange={(e) => handleKeyValueChange(index, 'key', e.target.value, dataExtractionFields, setDataExtractionFields, form, 'post_call_actions.data_extracted')}
                    placeholder="Field name"
                    className="h-9 text-sm"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={field.value}
                      onChange={(e) => handleKeyValueChange(index, 'value', e.target.value, dataExtractionFields, setDataExtractionFields, form, 'post_call_actions.data_extracted')}
                      placeholder="Description"
                      className="h-9 text-sm flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveKeyValuePair(index, dataExtractionFields, setDataExtractionFields, form, 'post_call_actions.data_extracted')}
                      className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepPostCall; 