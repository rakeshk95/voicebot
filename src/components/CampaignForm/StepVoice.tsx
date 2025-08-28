import React, { useEffect, useState, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { authorizedFetch } from "@/lib/api";

const PRIMARY_COLOR = '#2B50A1'; // Voxiflow blue
const ACCENT_COLOR = '#F15A29';  // Voxiflow orange

interface StepVoiceProps {
  form: UseFormReturn<any>;
  selectedVoiceId?: string | null;
}

const StepVoice = ({ form, selectedVoiceId }: StepVoiceProps) => {
  console.log('StepVoice component rendering with props:', { form, selectedVoiceId });
  
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('all');
  const [gender, setGender] = useState('all');
  const [type, setType] = useState('all');
  const [provider, setProvider] = useState('11labs');
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [voicesPerPage] = useState(10);
  
  console.log('StepVoice state initialized');
  
  useEffect(() => {
    // Fetch all voices from a single API call
    console.log('StepVoice: Starting to fetch voices...');
    setLoading(true);
    setError(null);
    
    authorizedFetch('/voices', {
      headers: {
        'accept': 'application/json',
      },
    })
      .then(async (res) => {
        console.log('StepVoice: API response status:', res.status);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error((errorData as any).detail || `Failed to fetch voices: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('StepVoice: Voices data received:', data);
        console.log('StepVoice: Number of voices:', Array.isArray(data) ? data.length : 0);
        setVoices(data as any[]);
        setLoading(false);
      })
      .catch((error) => {
        console.error('StepVoice: Voice API error:', error);
        setError(error.message);
        setVoices([]);
        setLoading(false);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      });
  }, [toast]);
  
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
    console.log('StepVoice: Filtering voice:', voice);
    // Filter by provider source
    if (provider === '11labs' && voice.source !== 'eleven_labs') {
      console.log('StepVoice: Filtering out voice due to provider mismatch:', voice.source);
      return false;
    }
    if (provider === 'cartesia' && voice.source !== 'cartesia') {
      console.log('StepVoice: Filtering out voice due to provider mismatch:', voice.source);
      return false;
    }
    
    // Apply other filters
    const matchesSearch = search === '' || (voice.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesLanguage = language === 'all' || language === '' || (voice.language || '').toLowerCase() === language;
    const matchesGender = gender === 'all' || gender === '' || (voice.gender || '').toLowerCase() === gender;
    const matchesType = type === 'all' || type === '' || (voice.main_accent || '').toLowerCase() === type;
    
    if (!matchesSearch) {
      console.log('StepVoice: Filtering out voice due to search mismatch:', voice.name);
    }
    if (!matchesLanguage) {
      console.log('StepVoice: Filtering out voice due to language mismatch:', voice.language);
    }
    if (!matchesGender) {
      console.log('StepVoice: Filtering out voice due to gender mismatch:', voice.gender);
    }
    if (!matchesType) {
      console.log('StepVoice: Filtering out voice due to type mismatch:', voice.main_accent || voice.accent);
    }

    return matchesSearch && matchesLanguage && matchesGender && matchesType;
  });

  // Pagination logic
  const indexOfLastVoice = currentPage * voicesPerPage;
  const indexOfFirstVoice = indexOfLastVoice - voicesPerPage;
  const currentVoices = filteredVoices.slice(indexOfFirstVoice, indexOfLastVoice);
  const totalPages = Math.ceil(filteredVoices.length / voicesPerPage);

  console.log('StepVoice: Pagination info:', {
    totalVoices: voices.length,
    filteredVoices: filteredVoices.length,
    currentVoices: currentVoices.length,
    currentPage,
    totalPages,
    indexOfFirstVoice,
    indexOfLastVoice
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, language, gender, type, provider]);

  // Get unique languages and genders for filter options
  const uniqueLanguages = [...new Set(voices.map(voice => voice.language).filter(Boolean))];
  const uniqueGenders = [...new Set(voices.map(voice => voice.gender).filter(Boolean))];
  const uniqueTypes = [...new Set(voices.map(voice => voice.main_accent || voice.accent).filter(Boolean))];

  console.log('StepVoice about to render with:', { 
    voicesCount: voices.length, 
    filteredCount: filteredVoices.length,
    currentPage,
    totalPages 
  });

  return (
    <div className="space-y-6">
      {/* Transfer Call Option */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Call Transfer Configuration</h3>
        
        <FormField
          control={form.control}
          name="tts.transfer_call"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium text-gray-700">Enable Call Transfer</FormLabel>
                <div className="text-xs text-gray-500">
                  Allow the AI agent to transfer calls to human agents when needed
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Voice Selection Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 px-2">Voice Selection</h3>
        
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-white rounded-lg">
          <Input
            placeholder="Search for voices..."
            className="w-48 min-w-[150px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 rounded"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-28 min-w-[90px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 rounded">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="11labs">Eleven Labs</SelectItem>
              <SelectItem value="cartesia">Cartesia</SelectItem>
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-28 min-w-[90px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 rounded">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {uniqueLanguages.map(lang => (
                <SelectItem key={lang} value={lang.toLowerCase()}>
                  {lang.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="w-28 min-w-[90px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 rounded">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              {uniqueGenders.map(gen => (
                <SelectItem key={gen} value={gen.toLowerCase()}>
                  {gen.charAt(0).toUpperCase() + gen.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-28 min-w-[90px] h-8 text-sm bg-gray-50 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 rounded">
              <SelectValue placeholder="Voice Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(t => (
                <SelectItem key={t} value={t.toLowerCase()}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            className="ml-2 px-3 h-8 text-sm rounded bg-gray-100 border border-gray-300 hover:bg-gray-200 transition"
            onClick={() => {
              setSearch('');
              setProvider('11labs');
              setLanguage('all');
              setGender('all');
              setType('all');
              setSelected(null);
              setError(null);
              setCurrentPage(1);
            }}
          >
            Reset
          </button>
        </div>

        {/* Results Summary */}
        <div className="mb-3 px-2 text-sm text-gray-600">
          Showing {indexOfFirstVoice + 1}-{Math.min(indexOfLastVoice, filteredVoices.length)} of {filteredVoices.length} voices
          {search && ` matching "${search}"`}
          {` from ${provider === '11labs' ? 'Eleven Labs' : 'Cartesia'}`}
          {language && language !== 'all' && ` in ${language.toUpperCase()}`}
          {gender && gender !== 'all' && ` (${gender.charAt(0).toUpperCase() + gender.slice(1)})`}
          {type && type !== 'all' && ` - ${type.charAt(0).toUpperCase() + type.slice(1)}`}
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



        {/* Voice List Table */}
        <div className="w-full overflow-x-auto md:overflow-x-visible">
          <audio ref={audioRef} style={{ display: 'none' }} />
          {loading ? (
            <div className="p-2 text-center text-gray-500">Loading voices...</div>
                     ) : filteredVoices.length === 0 && !error ? (
             <div className="p-2 text-center text-gray-500">
               No voices found matching your criteria.
             </div>
          ) : (
            <table className="w-full min-w-[700px] max-w-full bg-white border border-gray-200 rounded shadow-sm text-sm">
              <thead>
                <tr style={{ background: PRIMARY_COLOR }} className="text-white">
                  <th className="px-2 py-2 text-left font-semibold"> </th>
                  <th className="px-2 py-2 text-left font-semibold">Name</th>
                  <th className="px-2 py-2 text-left font-semibold">Provider</th>
                  <th className="px-2 py-2 text-left font-semibold">Voice Type</th>
                  <th className="px-2 py-2 text-left font-semibold">Gender</th>
                  <th className="px-2 py-2 text-left font-semibold">Country</th>
                  <th className="px-2 py-2 text-left font-semibold">Language</th>
                  <th className="px-2 py-2 text-left font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {currentVoices.map((voice: any, idx: number) => {
                  // Improved data mapping for both providers
                  const country = voice.locale ? (voice.locale.split('-')[1] || '-') : (voice.country || '-');
                  const languageLabel = voice.language ? voice.language.toUpperCase() : '-';
                  const previewUrl = voice.lang_preview_url || voice.main_preview_url || voice.preview_url;
                  return (
                    <tr key={voice.voice_id || voice.id || idx} className={
                      `border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`
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
                        <span className="text-blue-500 font-medium">{voice.source === 'eleven_labs' ? 'Eleven Labs' : voice.source === 'cartesia' ? 'Cartesia' : voice.source || '-'}</span>
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
                          className="accent-orange-500 w-4 h-4"
                          checked={selected === (voice.voice_id || voice.id)}
                          onChange={() => {
                            const voiceId = voice.voice_id || voice.id;
                            setSelected(voiceId);
                            form.setValue('tts.voice_id', voiceId);
                            form.setValue('tts.language', voice.language || '');
                            form.setValue('tts.gender', voice.gender || '');
                            console.log('StepVoice: Setting TTS vendor to:', provider, 'for provider:', provider);
                            form.setValue('tts.vendor', provider);
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded border ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepVoice; 