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

// Helper to convert snake_case to Human Friendly Label
function toLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Map display label to payload key if needed
const DISPLAY_TO_PAYLOAD_KEY: Record<string, string> = {
  'Clinic Name': 'clinic_name',
  // Add more mappings as needed
};

const CampaignCall = ({
  campaign,
  form,
  onSubmit,
  onCancel
}: CampaignCallProps) => {
  if (!campaign) return null;

  // Debug: log prompt variables at render
  console.log('Prompt Variables:', campaign?.llm?.promptJson?.promptVariables);

  // Get variables from campaign prop
  const variableKeys = Object.keys(campaign?.llm?.promptJson?.promptVariables || {}).filter(
    key => key !== 'mobile_number' && key !== 'caller_name'
  );
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {variableKeys.map((key) => (
            <FormField
              key={key}
              control={form.control}
              name={key}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{toLabel(key)}</FormLabel>
                  <Input {...field} placeholder={`Enter ${toLabel(key)}`} />
                </FormItem>
              )}
            />
          ))}
          <FormField
            control={form.control}
            name="mobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <Input {...field} placeholder="Enter mobile number" />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-blue-700 text-white">{form.formState.isSubmitting ? 'Calling...' : 'Make Call'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default CampaignCall;