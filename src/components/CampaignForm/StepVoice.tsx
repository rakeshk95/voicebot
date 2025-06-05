import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface StepVoiceProps {
  form: UseFormReturn<any>;
}

const StepVoice = ({ form }: StepVoiceProps) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 space-y-4 min-h-[400px]">
        <FormField
          control={form.control}
          name="tts.gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Voice Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tts.voice_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Voice ID</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hi-IN-AnanyaNeural">Ananya (Hindi)</SelectItem>
                  <SelectItem value="en-IN-NeerjaNeural">Neerja (English)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default StepVoice; 