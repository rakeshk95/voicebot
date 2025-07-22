import React, { useEffect, useState, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ELEVEN_LABS_API = 'http://192.168.0.8:8000/api/v1/voices?voice_ids=XopCoWNooN3d7LfWZyX5,p9aflnsbBe1o0aDeQa97,2bNrEsM0omyhLiEyOwqY,f91ab3e6-5071-4e15-b016-cde6f2bcd222';
  // Use the login token from localStorage for Authorization

  useEffect(() => {
    if (provider === 'elevenlabs') {
      setLoading(true);
      fetch(ELEVEN_LABS_API, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'accept': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setVoices(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (provider === '' || provider === 'cartesia') {
      // Optionally clear or fetch Cartesia voices here
      setVoices([]);
    }
  }, [provider]);

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

  // Filtering logic
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
          }}
        >
          Reset
        </button>
      </div>

      {/* Voice List Table */}
      <div className="w-full overflow-x-auto md:overflow-x-visible">
        <audio ref={audioRef} style={{ display: 'none' }} />
        {loading ? (
          <div className="p-2 text-center text-gray-500">Loading voices...</div>
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
                // For Eleven Labs mapping
                const country = voice.locale ? (voice.locale.split('-')[1] || '-') : '-';
                const languageLabel = voice.language ? voice.language.toUpperCase() : '-';
                const previewUrl = voice.lang_preview_url || voice.main_preview_url;
                return (
                  <tr key={voice.voice_id || idx} className={
                    `border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-[${PRIMARY_COLOR}]/10 transition-colors`
                  }>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-full relative"
                        style={{ background: ACCENT_COLOR }}
                        title="Play"
                        onClick={() => handlePlay(previewUrl)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 20 20" className={`w-4 h-4 ${isPlayingId === previewUrl ? 'animate-spin' : ''}`}><path d="M6 4l10 6-10 6V4z" /></svg>
                        {isPlayingId === previewUrl && <span className="absolute -right-10 text-xs text-blue-600 font-semibold">Playing...</span>}
                      </button>
                    </td>
                    <td className="px-2 py-2 flex items-center gap-2">
                      <span className="font-bold text-gray-800">{voice.name}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-blue-500 font-medium">{voice.main_accent || '-'}</span>
                    </td>
                    <td className="px-2 py-2 capitalize text-gray-700">{voice.gender || '-'}</td>
                    <td className="px-2 py-2">{country}</td>
                    <td className="px-2 py-2">{languageLabel}</td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        className={`accent-[${ACCENT_COLOR}] w-4 h-4`}
                        checked={selected === voice.voice_id}
                        onChange={() => {
                          setSelected(voice.voice_id);
                          form.setValue('tts.voice_id', voice.voice_id);
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