import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  RotateCcw, 
  Eye, 
  GitCompare, 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  getCampaignVersions, 
  restoreToVersion, 
  getCampaignVersion,
  compareVersions,
  getVersionChangeSummary,
  CampaignVersion 
} from '@/lib/campaignVersioningApi';

interface CampaignVersionHistoryProps {
  campaignId: string;
  onVersionRestored?: (newVersion: CampaignVersion) => void;
}

interface VersionComparisonProps {
  version1: CampaignVersion;
  version2: CampaignVersion;
  onClose: () => void;
}

const VersionComparison: React.FC<VersionComparisonProps> = ({ version1, version2, onClose }) => {
  const comparison = compareVersions(version1, version2);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Version Comparison
          </DialogTitle>
          <DialogDescription>
            Comparing version {version1.version} with version {version2.version}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {comparison.changes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No differences found between these versions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comparison.changes.map((change, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={
                              change.type === 'added' ? 'default' : 
                              change.type === 'removed' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {change.type}
                          </Badge>
                          <span className="font-medium">{change.field}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Previous Value:</p>
                            <div className="bg-gray-50 p-2 rounded border">
                              <pre className="whitespace-pre-wrap break-words">
                                {change.oldValue === undefined ? 'undefined' : 
                                 typeof change.oldValue === 'object' ? 
                                 JSON.stringify(change.oldValue, null, 2) : 
                                 String(change.oldValue)}
                              </pre>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground mb-1">New Value:</p>
                            <div className="bg-gray-50 p-2 rounded border">
                              <pre className="whitespace-pre-wrap break-words">
                                {change.newValue === undefined ? 'undefined' : 
                                 typeof change.newValue === 'object' ? 
                                 JSON.stringify(change.newValue, null, 2) : 
                                 String(change.newValue)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export const CampaignVersionHistory: React.FC<CampaignVersionHistoryProps> = ({ 
  campaignId, 
  onVersionRestored 
}) => {
  const [versions, setVersions] = useState<CampaignVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [comparingVersions, setComparingVersions] = useState<{v1: CampaignVersion | null, v2: CampaignVersion | null}>({v1: null, v2: null});
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchVersions();
  }, [campaignId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaignVersions(campaignId);
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch versions');
      toast({
        title: "Error",
        description: "Failed to load campaign versions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionNumber: string) => {
    if (window.confirm(`Are you sure you want to restore to version ${versionNumber}? This will create a new version with the restored content.`)) {
      try {
        const result = await restoreToVersion(campaignId, versionNumber);
        toast({
          title: "Version Restored",
          description: `Campaign restored to version ${versionNumber}. New version ${result.new_version} created.`,
        });
        
        // Refresh versions and notify parent
        await fetchVersions();
        if (onVersionRestored) {
          onVersionRestored(result.campaign);
        }
      } catch (err) {
        toast({
          title: "Restore Failed",
          description: err instanceof Error ? err.message : "Failed to restore version",
          variant: "destructive",
        });
      }
    }
  };

  const toggleVersionExpansion = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const toggleVersionSelection = (versionId: string) => {
    const newSelected = new Set(selectedVersions);
    if (newSelected.has(versionId)) {
      newSelected.delete(versionId);
    } else {
      newSelected.add(versionId);
    }
    setSelectedVersions(newSelected);
  };

  const handleCompare = () => {
    const selected = Array.from(selectedVersions);
    if (selected.length === 2) {
      const v1 = versions.find(v => v.id === selected[0]);
      const v2 = versions.find(v => v.id === selected[1]);
      if (v1 && v2) {
        setComparingVersions({ v1, v2 });
      }
    }
  };

  const getVersionStatusColor = (version: CampaignVersion, index: number) => {
    if (index === 0) return 'bg-green-100 text-green-800 border-green-200';
    if (version.state === 'ACTIVE') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (version.state === 'DRAFT') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            <span>Loading version history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchVersions} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            View and manage campaign versions. Select two versions to compare them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4" />
              <p>No versions found for this campaign</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Compare Button */}
              {selectedVersions.size === 2 && (
                <div className="flex justify-center">
                  <Button onClick={handleCompare} className="gap-2">
                    <GitCompare className="h-4 w-4" />
                    Compare Selected Versions
                  </Button>
                </div>
              )}

              {/* Version List */}
              <div className="space-y-3">
                {versions.map((version, index) => {
                  const isExpanded = expandedVersions.has(version.id);
                  const isSelected = selectedVersions.has(version.id);
                  const isCurrent = index === 0;
                  const previousVersion = versions[index + 1];

                  return (
                    <Card key={version.id} className={`transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleVersionSelection(version.id)}
                              className="rounded border-gray-300"
                              disabled={selectedVersions.size >= 2 && !isSelected}
                            />
                            
                            <div className="flex items-center gap-2">
                              <Badge className={getVersionStatusColor(version, index)}>
                                Version {version.version}
                              </Badge>
                              {isCurrent && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  Current
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(version.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {version.created_by}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleVersionExpansion(version.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>

                            {!isCurrent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(version.version)}
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="mt-2">
                          <h4 className="font-medium text-lg">{version.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getVersionChangeSummary(version, previousVersion)}
                          </p>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium mb-1">State:</p>
                                <Badge variant="outline">{version.state}</Badge>
                              </div>
                              <div>
                                <p className="font-medium mb-1">Created:</p>
                                <p>{new Date(version.created_at).toLocaleString()}</p>
                              </div>
                              {version.llm && (
                                <div className="md:col-span-2">
                                  <p className="font-medium mb-1">LLM Model:</p>
                                  <p className="text-muted-foreground">{version.llm.model}</p>
                                </div>
                              )}
                              {version.tts && (
                                <div className="md:col-span-2">
                                  <p className="font-medium mb-1">Voice:</p>
                                  <p className="text-muted-foreground">
                                    {version.tts.gender} - {version.tts.language}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Comparison Dialog */}
      {comparingVersions.v1 && comparingVersions.v2 && (
        <VersionComparison
          version1={comparingVersions.v1}
          version2={comparingVersions.v2}
          onClose={() => setComparingVersions({v1: null, v2: null})}
        />
      )}
    </>
  );
};

export default CampaignVersionHistory;
