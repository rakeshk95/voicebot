import React from 'react';
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Phone } from 'lucide-react';
import { UseFormReturn } from "react-hook-form";
import { Campaign } from "@/types/campaign";

interface CampaignCallProps {
  campaign: Campaign | null;
  form: UseFormReturn<any>;
  onSubmit: () => void;
  onCancel: () => void;
}

const CampaignCall = ({
  campaign,
  form,
  onSubmit,
  onCancel
}: CampaignCallProps) => {
  if (!campaign) return null;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="callerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Caller Name</FormLabel>
              <FormControl>
                <Input
                  {...field} 
                  placeholder="Enter caller name"
                  className="h-10 px-3 rounded-md border border-gray-200 focus:border-primary"
                />
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Mobile Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    {...field} 
                    type="tel"
                    placeholder="Enter mobile number"
                    className="h-10 pl-10 pr-3 rounded-md border border-gray-200 focus:border-primary"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-4 py-2 bg-primary text-white hover:bg-primary/90"
          >
            <Phone className="w-4 h-4 mr-2" />
            Make Call
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CampaignCall; 