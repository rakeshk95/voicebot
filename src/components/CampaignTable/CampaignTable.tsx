import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Phone, History, Upload, Edit, Trash2 } from 'lucide-react';
import { Campaign } from "@/types/campaign";
import { useNavigate } from 'react-router-dom';

interface CampaignTableProps {
  campaigns: Campaign[];
  onView: (campaign: Campaign) => void;
  onCall: (campaign: Campaign) => void;
  onUpload: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  isLoading: boolean;
}

const CampaignTable = ({
  campaigns,
  onView,
  onCall,
  onUpload,
  onEdit,
  onDelete,
  isLoading
}: CampaignTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Campaign Name</TableHead>
            <TableHead className="font-semibold">Direction</TableHead>
            <TableHead className="font-semibold">Language</TableHead>
            <TableHead className="font-semibold">Voice ID</TableHead>
            <TableHead className="font-semibold">Provider</TableHead>
            <TableHead className="font-semibold">Created At</TableHead>
            <TableHead className="font-semibold">Updated At</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Loading campaigns...
                </div>
              </TableCell>
            </TableRow>
          ) : campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                No campaigns found
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-gray-900">{campaign.name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={campaign.direction === 'INBOUND' ? 'default' : 'secondary'}>
                    {campaign.direction}
                  </Badge>
                </TableCell>
                <TableCell>{campaign.tts?.language}</TableCell>
                <TableCell>{campaign.tts?.voice_id}</TableCell>
                <TableCell>
                  <Badge variant="outline">{campaign.telephonic_provider}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(campaign.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell>
                  {new Date(campaign.updated_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onView(campaign)}
                      className="hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onCall(campaign)}
                      className="hover:bg-gray-100"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => navigate(`/call-history?campaignId=${campaign.id}&campaignName=${encodeURIComponent(campaign.name)}`)}
                      className="hover:bg-gray-100"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onUpload(campaign)}
                      className="hover:bg-gray-100"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEdit(campaign)}
                      className="hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(campaign)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CampaignTable; 