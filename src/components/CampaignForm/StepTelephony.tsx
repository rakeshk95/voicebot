import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface StepTelephonyProps {
  form: UseFormReturn<any>;
}

const StepTelephony = ({ form }: StepTelephonyProps) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 space-y-4">
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
                  <SelectItem value="exotel">Exotel</SelectItem>
                  <SelectItem value="sampark">Sampark</SelectItem>
                  <SelectItem value="smallestai">SmallestAI</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        
        {/* New Telephony Configuration Fields */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Telephony Configuration</h3>
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
                      min="1"
                      max="100"
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
      </div>
    </div>
  );
};

export default StepTelephony; 