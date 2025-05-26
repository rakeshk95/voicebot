
import React, { useState } from 'react';
import { Mic, Play, Pause, Download, Settings, Waveform, Brain, Sparkles, Volume2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('aria');
  const [pitch, setPitch] = useState([1]);
  const [speed, setSpeed] = useState([1]);
  const [volume, setVolume] = useState([0.8]);

  const voices = [
    { id: 'aria', name: 'Aria', type: 'Neural', accent: 'American' },
    { id: 'sarah', name: 'Sarah', type: 'Premium', accent: 'British' },
    { id: 'liam', name: 'Liam', type: 'Neural', accent: 'Australian' },
    { id: 'charlotte', name: 'Charlotte', type: 'Premium', accent: 'Canadian' },
  ];

  const projects = [
    { id: 1, name: 'Customer Support Bot', status: 'Active', voices: 3, duration: '2:34' },
    { id: 2, name: 'Educational Assistant', status: 'Draft', voices: 1, duration: '5:12' },
    { id: 3, name: 'Marketing Narrator', status: 'Complete', voices: 2, duration: '1:45' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">VoiceBot Studio</h1>
                <p className="text-sm text-purple-300">AI Voice Design Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Pro
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="studio" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="studio" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-200">
              Voice Studio
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-200">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-200">
              Voice Library
            </TabsTrigger>
          </TabsList>

          {/* Voice Studio Tab */}
          <TabsContent value="studio">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Studio */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-black/20 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Mic className="w-5 h-5 mr-2 text-purple-400" />
                      Text to Speech Studio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="text-input" className="text-purple-200">Enter your text</Label>
                      <Textarea
                        id="text-input"
                        placeholder="Type or paste your text here to generate AI voice..."
                        className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-gray-400 min-h-[120px]"
                        defaultValue="Welcome to VoiceBot Studio, the future of AI voice generation. Create stunning voiceovers with our advanced neural networks."
                      />
                    </div>

                    {/* Waveform Visualization */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-purple-200 text-sm">Audio Preview</span>
                        <span className="text-purple-300 text-sm">2:34 / 2:34</span>
                      </div>
                      <div className="flex items-center space-x-2 h-16">
                        {Array.from({ length: 50 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 bg-gradient-to-t rounded-full transition-all duration-300 ${
                              i < 25 ? 'from-purple-500 to-pink-500 opacity-80' : 'from-purple-500/30 to-pink-500/30'
                            }`}
                            style={{
                              height: `${Math.random() * 100 + 20}%`,
                              animationDelay: `${i * 50}ms`
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </Button>
                      <Button variant="ghost" className="text-white hover:bg-white/10">
                        <Download className="w-5 h-5 mr-2" />
                        Download
                      </Button>
                      <Button variant="ghost" className="text-white hover:bg-white/10">
                        <Save className="w-5 h-5 mr-2" />
                        Save Project
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Voice Settings Sidebar */}
              <div className="space-y-6">
                <Card className="bg-black/20 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Voice Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-purple-200">Voice Model</Label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          {voices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id} className="text-white">
                              <div className="flex flex-col">
                                <span>{voice.name}</span>
                                <span className="text-xs text-purple-300">{voice.type} • {voice.accent}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-purple-200 flex items-center justify-between">
                          Pitch
                          <span className="text-sm text-purple-300">{pitch[0].toFixed(1)}x</span>
                        </Label>
                        <Slider
                          value={pitch}
                          onValueChange={setPitch}
                          max={2}
                          min={0.5}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-purple-200 flex items-center justify-between">
                          Speed
                          <span className="text-sm text-purple-300">{speed[0].toFixed(1)}x</span>
                        </Label>
                        <Slider
                          value={speed}
                          onValueChange={setSpeed}
                          max={2}
                          min={0.5}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-purple-200 flex items-center justify-between">
                          Volume
                          <span className="text-sm text-purple-300">{Math.round(volume[0] * 100)}%</span>
                        </Label>
                        <Slider
                          value={volume}
                          onValueChange={setVolume}
                          max={1}
                          min={0}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-purple-200">Auto-enhance</Label>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-purple-200">Background noise reduction</Label>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                      <Waveform className="w-4 h-4 mr-2" />
                      Clone Voice
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Voice Effects
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">My Projects</h2>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  Create New Project
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="bg-black/20 backdrop-blur-xl border-white/10 hover:border-purple-500/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          project.status === 'Active' ? 'bg-green-500/20 text-green-300' :
                          project.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-purple-200">
                        <div className="flex justify-between">
                          <span>Voices:</span>
                          <span>{project.voices}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{project.duration}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Voice Library Tab */}
          <TabsContent value="library">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Voice Library</h2>
                <Input
                  placeholder="Search voices..."
                  className="max-w-sm bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {voices.map((voice) => (
                  <Card key={voice.id} className="bg-black/20 backdrop-blur-xl border-white/10 hover:border-purple-500/50 transition-colors cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Volume2 className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">{voice.name}</h3>
                      <p className="text-purple-300 text-sm mb-1">{voice.type}</p>
                      <p className="text-purple-400 text-xs">{voice.accent}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-4 w-full text-white hover:bg-white/10"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
