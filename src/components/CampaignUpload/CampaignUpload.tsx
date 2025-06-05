import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from 'lucide-react';
import { Campaign } from "@/types/campaign";

interface CampaignUploadProps {
  campaign: Campaign | null;
  uploadFile: File | null;
  isUploading: boolean;
  onFileChange: (file: File) => void;
  onUpload: () => void;
  onCancel: () => void;
}

const CampaignUpload = ({
  campaign,
  uploadFile,
  isUploading,
  onFileChange,
  onUpload,
  onCancel
}: CampaignUploadProps) => {
  if (!campaign) return null;

  return (
    <div className="space-y-6 py-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400" />
          <label
            htmlFor="file-upload-bulk"
            className="mt-4 cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 flex items-center"
          >
            <span>Select file</span>
            <input
              id="file-upload-bulk"
              name="file-upload-bulk"
              type="file"
              className="sr-only"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileChange(file);
                }
              }}
            />
          </label>
          <p className="mt-2 text-sm text-gray-500">
            {uploadFile ? uploadFile.name : "CSV files only"}
          </p>
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={onUpload}
          disabled={!uploadFile || isUploading}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CampaignUpload; 