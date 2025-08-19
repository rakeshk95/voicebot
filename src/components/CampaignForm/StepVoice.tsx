import React, { useEffect, useState, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const PRIMARY_COLOR = '#2B50A1'; // Voxiflow blue
const ACCENT_COLOR = '#F15A29';  // Voxiflow orange

interface StepVoiceProps {
  form: UseFormReturn<any>;
  selectedVoiceId?: string | null;
}

const StepVoice = ({ form, selectedVoiceId }: StepVoiceProps) => {
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [gender, setGender] = useState('');
  const [type, setType] = useState('');
  const [provider, setProvider] = useState('elevenlabs');
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  // API endpoints - removed hardcoded voice IDs
  const ELEVEN_LABS_API = 'https://platform.voxiflow.com/backend/api/v1/voices';
  const CARTESIA_API = 'https://platform.voxiflow.com/backend/api/v1/voices?voice_ids=f91ab3e6-5071-4e15-b016-cde6f2bcd222';
  
  useEffect(() => {
    if (provider === 'elevenlabs') {
      setLoading(true);
      setError(null);
      fetch(ELEVEN_LABS_API, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'accept': 'application/json',
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch Eleven Labs voices: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setVoices(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Eleven Labs API error:', error);
          setError(error.message);
          setVoices([]);
          setLoading(false);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        });
  
    } else if (provider === 'cartesia') {
      setLoading(true);
      setError(null);
      
      // Check if Cartesia token exists
    
      fetch(CARTESIA_API, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'accept': 'application/json',
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch Cartesia voices: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setVoices(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Cartesia API error:', error);
          setError(error.message);
          setVoices([]);
          setLoading(false);
          toast({
            title: "Cartesia API Error",
            description: error.message,
            variant: "destructive",
          });
        });
  
    } else {
      // No provider or unsupported provider → clear voices
      setVoices([]);
      setError(null);
    }
  }, [provider, toast]);
  
  useEffect(() => {
    const formVoiceId = form.getValues('tts.voice_id');
    if (selectedVoiceId && selectedVoiceId !== selected) {
      setSelected(selectedVoiceId);
    } else if (formVoiceId && formVoiceId !== selected) {
      setSelected(formVoiceId);
    }
  }, [selectedVoiceId, form]);

  const handlePlay = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingUrl(url);
  };

  useEffect(() => {
    if (playingUrl && audioRef.current) {
      audioRef.current.src = playingUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlayingId(playingUrl);
      }).catch(() => {
        setIsPlayingId(null);
      });
    }
  }, [playingUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setIsPlayingId(null);
    const handleError = () => setIsPlayingId(null);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioRef.current]);

  // Improved filtering logic with better data structure handling
  const filteredVoices = voices.filter((voice: any) => {
    if (provider === 'elevenlabs') {
      if (voice.source !== 'eleven_labs') return false;
      const matchesSearch = search === '' || (voice.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesLanguage = language === '' || (voice.language || '').toLowerCase() === language;
      const matchesGender = gender === '' || (voice.gender || '').toLowerCase() === gender;
      const matchesType = type === '' || (voice.main_accent || '').toLowerCase() === type;
      return matchesSearch && matchesLanguage && matchesGender && matchesType;
    } else if (provider === 'cartesia') {
      if (voice.source !== 'cartesia') return false;
      const matchesSearch = search === '' || (voice.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesLanguage = language === '' || (voice.language || '').toLowerCase() === language;
      const matchesGender = gender === '' || (voice.gender || '').toLowerCase() === gender;
      const matchesType = type === '' || (voice.main_accent || '').toLowerCase() === type;
      return matchesSearch && matchesLanguage && matchesGender && matchesType;
    }
    return false;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-white rounded-lg">
        <Input
          placeholder="Search for voices"
          className="w-36 min-w-[100px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-[${PRIMARY_COLOR}] focus:ring-2 focus:ring-[${PRIMARY_COLOR}] rounded"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-28 min-w-[90px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-[${PRIMARY_COLOR}] focus:ring-2 focus:ring-[${PRIMARY_COLOR}] rounded">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="elevenlabs">Eleven Labs</SelectItem>
            <SelectItem value="cartesia">Cartesia</SelectItem>
          </SelectContent>
        </Select>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-28 min-w-[90px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-[${PRIMARY_COLOR}] focus:ring-2 focus:ring-[${PRIMARY_COLOR}] rounded">
            <SelectValue placeholder="Language" />
                  </SelectTrigger>
                <SelectContent>
            <SelectItem value="hi">Hindi</SelectItem>
            <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger className="w-28 min-w-[90px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-[${PRIMARY_COLOR}] focus:ring-2 focus:ring-[${PRIMARY_COLOR}] rounded">
            <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
        <button
          type="button"
          className="ml-2 px-3 h-8 text-sm rounded bg-gray-100 border border-gray-300 hover:bg-gray-200 transition"
          onClick={() => {
            setSearch('');
            setProvider('elevenlabs');
            setLanguage('');
            setGender('');
            setSelected(null);
            setError(null);
          }}
        >
          Reset
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Cartesia Token Configuration */}
      {provider === 'cartesia' && !localStorage.getItem('cartesiaToken') && (
        <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-blue-800 text-sm font-medium mb-2">Cartesia Configuration Required</h4>
              <p className="text-blue-700 text-sm mb-3">
                To use Cartesia voices, you need to configure your Cartesia API token. Please contact your administrator or refer to the Cartesia documentation.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  placeholder="Enter Cartesia API Token"
                  className="flex-1 text-sm"
                  id="cartesia-token-input"
                />
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={() => {
                    const tokenInput = document.getElementById('cartesia-token-input') as HTMLInputElement;
                    const token = tokenInput?.value?.trim();
                    if (token) {
                      localStorage.setItem('cartesiaToken', token);
                      toast({
                        title: "Success",
                        description: "Cartesia token configured successfully",
                        variant: "default",
                      });
                      // Trigger a re-fetch of voices
                      setProvider('elevenlabs');
                      setTimeout(() => setProvider('cartesia'), 100);
                    } else {
                      toast({
                        title: "Error",
                        description: "Please enter a valid Cartesia API token",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cartesia Token Management */}
      {provider === 'cartesia' && localStorage.getItem('cartesiaToken') && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 text-sm font-medium">Cartesia token configured</span>
            </div>
            <button
              type="button"
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
              onClick={() => {
                localStorage.removeItem('cartesiaToken');
                toast({
                  title: "Token Removed",
                  description: "Cartesia token has been removed",
                  variant: "default",
                });
                setVoices([]);
                setError(null);
              }}
            >
              Remove Token
            </button>
          </div>
        </div>
      )}

      {/* Voice List Table */}
      <div className="w-full overflow-x-auto md:overflow-x-visible">
        <audio ref={audioRef} style={{ display: 'none' }} />
        {loading ? (
          <div className="p-2 text-center text-gray-500">Loading voices...</div>
        ) : filteredVoices.length === 0 && !error ? (
          <div className="p-2 text-center text-gray-500">
            {provider === 'cartesia' && !localStorage.getItem('cartesiaToken') 
              ? 'Cartesia token not configured. Please set up Cartesia authentication.'
              : 'No voices found matching your criteria.'}
          </div>
        ) : (
          <table className="w-full min-w-[700px] max-w-full bg-white border border-gray-200 rounded shadow-sm text-sm">
            <thead>
              <tr style={{ background: PRIMARY_COLOR }} className="text-white">
                <th className="px-2 py-2 text-left font-semibold"> </th>
                <th className="px-2 py-2 text-left font-semibold">Name</th>
                <th className="px-2 py-2 text-left font-semibold">Voice Type</th>
                <th className="px-2 py-2 text-left font-semibold">Gender</th>
                <th className="px-2 py-2 text-left font-semibold">Country</th>
                <th className="px-2 py-2 text-left font-semibold">Language</th>
                <th className="px-2 py-2 text-left font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {filteredVoices.map((voice: any, idx: number) => {
                // Improved data mapping for both providers
                const country = voice.locale ? (voice.locale.split('-')[1] || '-') : (voice.country || '-');
                const languageLabel = voice.language ? voice.language.toUpperCase() : '-';
                const previewUrl = voice.lang_preview_url || voice.main_preview_url || voice.preview_url;
                return (
                  <tr key={voice.voice_id || voice.id || idx} className={
                    `border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-[${PRIMARY_COLOR}]/10 transition-colors`
                  }>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-full relative"
                        style={{ background: ACCENT_COLOR }}
                        title="Play"
                        onClick={() => handlePlay(previewUrl)}
                        disabled={!previewUrl}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 20 20" className={`w-4 h-4 ${isPlayingId === previewUrl ? 'animate-spin' : ''}`}><path d="M6 4l10 6-10 6V4z" /></svg>
                        {isPlayingId === previewUrl && <span className="absolute -right-10 text-xs text-blue-600 font-semibold">Playing...</span>}
                      </button>
                    </td>
                    <td className="px-2 py-2 flex items-center gap-2">
                      <span className="font-bold text-gray-800">{voice.name}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-blue-500 font-medium">{voice.main_accent || voice.accent || '-'}</span>
                    </td>
                    <td className="px-2 py-2 capitalize text-gray-700">{voice.gender || '-'}</td>
                    <td className="px-2 py-2">{country}</td>
                    <td className="px-2 py-2">{languageLabel}</td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        className={`accent-[${ACCENT_COLOR}] w-4 h-4`}
                        checked={selected === (voice.voice_id || voice.id)}
                        onChange={() => {
                          const voiceId = voice.voice_id || voice.id;
                          setSelected(voiceId);
                          form.setValue('tts.voice_id', voiceId);
                          form.setValue('tts.language', voice.language || '');
                          form.setValue('tts.gender', voice.gender || '');
                          form.setValue('tts.vendor', provider === 'elevenlabs' ? '11labs' : provider);
                        }}
                      />
                      <span className="ml-2 text-xs text-gray-600">Use voice</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StepVoice; 