import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Campaign } from "@/types/campaign";
import * as XLSX from 'xlsx-js-style';

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
  const [downloading, setDownloading] = useState(false);

  if (!campaign) return null;

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      // Prepare columns: Mobile Number + promptVariables
      const promptVars = campaign?.llm?.promptJson?.promptVariables || {};
      const variableKeys = Object.keys(promptVars).filter(k => k !== 'mobile_number');
      const columns = ['Mobile Number', ...variableKeys.map(k => k.replace(/_/g, ' '))];
      // Prepare worksheet data: just headers, no rows
      const wsData = [columns];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_upload_template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Optionally show a toast or error
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-end mt-2 mb-4">
        <Button
          variant="default"
          className="px-4 py-2 text-sm font-medium flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow border-none"
          onClick={handleDownloadTemplate}
          disabled={downloading}
        >
          <FileSpreadsheet className="w-4 h-4 text-white" />
          {downloading ? 'Downloading...' : 'Download Excel Template'}
        </Button>
      </div>
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