import React, { useState, useEffect, useRef } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { UseFormReturn } from "react-hook-form";
import { fetchWithAuth } from "@/auth/authorizedFetch";

interface StepTelephonyProps {
  form: UseFormReturn<any>;
}

const StepTelephony = ({ form }: StepTelephonyProps) => {
  const [selectedLLMProvider, setSelectedLLMProvider] = useState<string>('');
  const [selectedSTTVendor, setSelectedSTTVendor] = useState<string>('');
  const [llmModelsByProvider, setLlmModelsByProvider] = useState<Record<string, { value: string; label: string }[]>>({});
  const [sttModelsByVendor, setSttModelsByVendor] = useState<Record<string, { value: string; label: string }[]>>({});
  const [sttLanguagesByKey, setSttLanguagesByKey] = useState<Record<string, { value: string; label: string }[]>>({});
  const [telephonyProviders, setTelephonyProviders] = useState<{ value: string; label: string }[]>([]);
  const [llmProviders, setLlmProviders] = useState<{ value: string; label: string }[]>([]);
  const [sttVendors, setSttVendors] = useState<{ value: string; label: string }[]>([]);
  const fetchedOnceRef = useRef(false);
  
  // Debug: Log form values
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith('llm.')) {
        console.log('StepTelephony: LLM form values changed:', value.llm);
      }
      if (name?.startsWith('stt.')) {
        console.log('StepTelephony: STT form values changed:', value.stt);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Load external models/vendors dynamically
  useEffect(() => {
    async function loadExternalModels() {
      try {
        const res = await fetchWithAuth('/api/v1/external/models');
        if (!res.ok) throw new Error(`Failed to load models: ${res.status}`);
        const data = await res.json();

        const llmMap: Record<string, { value: string; label: string }[]> = {};
        const sttMap: Record<string, { value: string; label: string }[]> = {};
        const sttLangMap: Record<string, { value: string; label: string }[]> = {};

        // Preferred: data.models.{llm,stt,telephony}
        if (data?.models) {
          // llm providers
          if (Array.isArray(data.models.llm)) {
            const providerOptions: { value: string; label: string }[] = [];
            data.models.llm.forEach((provider: any) => {
              const providerKeyRaw = (provider.id || provider.display_name || '').toString();
              const providerLabel = (provider.display_name || provider.id || providerKeyRaw).toString();
              providerOptions.push({ value: providerKeyRaw, label: providerLabel });
              const models = Array.isArray(provider.models) ? provider.models : [];
              llmMap[providerKeyRaw] = models.map((m: any) => {
                const val = (m.id || m.display_name || m.name)?.toString();
                const label = (m.display_name || m.name || m.id || val)?.toString();
                return { value: val, label };
              });
            });
            setLlmProviders(providerOptions);
          }

          // stt vendors
          if (Array.isArray(data.models.stt)) {
            const vendorOptions: { value: string; label: string }[] = [];
            data.models.stt.forEach((vendor: any) => {
              const vendorKeyRaw = (vendor.id || vendor.display_name || '').toString();
              const vendorLabel = (vendor.display_name || vendor.id || vendorKeyRaw).toString();
              vendorOptions.push({ value: vendorKeyRaw, label: vendorLabel });
              const models = Array.isArray(vendor.models) ? vendor.models : [];
              sttMap[vendorKeyRaw] = models.map((m: any) => {
                const val = (m.id || m.display_name || m.name)?.toString();
                const label = (m.display_name || m.name || m.id || val)?.toString();
                // capture languages if available on model
                const langs = Array.isArray(m.language) ? m.language : [];
                const langOpts = langs.map((lng: any) => ({
                  value: (lng.id || lng.code || lng.value || lng)?.toString(),
                  label: (lng.display_name || lng.name || lng.id || lng)?.toString(),
                }));
                sttLangMap[`${vendorKeyRaw}::${val}`] = langOpts;
                return { value: val, label };
              });
            });
            setSttVendors(vendorOptions);
          }

          // telephony providers
          if (Array.isArray(data.models.telephony)) {
            setTelephonyProviders(
              data.models.telephony.map((p: any) => {
                const label = (p?.display_name || p)?.toString();
                const value = (p?.id || p)?.toString();
                return { value, label };
              })
            );
          }
        }

        // Heuristics to normalize various other shapes
        const candidates: any[] = Array.isArray(data) ? data : ([] as any[])
          .concat(data.items || [])
          .concat(Array.isArray(data.models) ? data.models : [])
          .concat(data.data || [])
          .concat(data.llm || [])
          .concat(data.stt || []);

        if (!Object.keys(llmMap).length && !Object.keys(sttMap).length && !candidates.length) {
          const tryGroup = (group: any, target: Record<string, { value: string; label: string }[]>) => {
            Object.keys(group || {}).forEach((k) => {
              const list = group[k];
              if (Array.isArray(list)) {
                target[k.toLowerCase()] = list.map((m: any) => {
                  const val = (m?.value || m?.id || m?.name || m)?.toString();
                  const label = (m?.label || m?.name || m?.display || val)?.toString();
                  return { value: val, label };
                });
              }
            });
          };
          if (data?.vendors?.llm) tryGroup(data.vendors.llm, llmMap);
          if (data?.vendors?.stt) tryGroup(data.vendors.stt, sttMap);
        }

        // Case: flat array of model entries
        (candidates || []).forEach((m: any) => {
          const type = (m?.type || m?.category || '').toString().toLowerCase();
          const provider = (m?.provider || m?.vendor || m?.source || '').toString().toLowerCase();
          const val = (m?.value || m?.id || m?.model || m?.name)?.toString();
          const label = (m?.label || m?.display || m?.name || m?.model || val)?.toString();
          if (!provider || !val) return;
          if (type === 'llm' || (!type && (m?.provider || '').toLowerCase() === provider)) {
            llmMap[provider] = llmMap[provider] || [];
            llmMap[provider].push({ value: val, label });
          } else if (type === 'stt') {
            sttMap[provider] = sttMap[provider] || [];
            sttMap[provider].push({ value: val, label });
          }
        });

        setLlmModelsByProvider(llmMap);
        setSttModelsByVendor(sttMap);
        setSttLanguagesByKey(sttLangMap);
      } catch (e) {
        console.warn('Failed to load external models, using defaults', e);
      }
    }
    if (!fetchedOnceRef.current) {
      fetchedOnceRef.current = true; // guard against React 18 StrictMode double-effect
      loadExternalModels();
    }
  }, []);

  // Get available STT models based on STT vendor (dynamic only)
  const getSTTModels = (sttVendor: string) => {
    console.log('getSTTModels called with vendor:', sttVendor);
    const dynamic = sttModelsByVendor[sttVendor] || sttModelsByVendor[sttVendor?.toLowerCase?.() || ''] || sttModelsByVendor[sttVendor?.toUpperCase?.() || ''];
    return dynamic && dynamic.length ? dynamic : [];
  };

  const getSTTLanguages = (sttVendor: string, sttModel: string) => {
    const key = `${sttVendor}::${sttModel}`;
    const dynamic = sttLanguagesByKey[key] || sttLanguagesByKey[key.toLowerCase?.() || ''] || [];
    return dynamic && dynamic.length ? dynamic : [];
  };

  // Get available LLM models based on provider (dynamic only)
  const getLLMModels = (provider: string) => {
    console.log('getLLMModels called with provider:', provider);
    const dynamic = llmModelsByProvider[provider] || llmModelsByProvider[provider?.toLowerCase?.() || ''] || llmModelsByProvider[provider?.toUpperCase?.() || ''];
    return dynamic && dynamic.length ? dynamic : [];
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 space-y-6">
        {/* Telephony Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Telephony Configuration</h3>
          
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Direction</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INBOUND">Inbound</SelectItem>
                    <SelectItem value="OUTBOUND">Outbound</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="telephonic_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Telephony Provider</FormLabel>
                <Select
                  onValueChange={val => field.onChange(val)}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {telephonyProviders.length > 0 ? (
                      telephonyProviders.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="__no_telephony__">No providers loaded</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          {/* Telephony Configuration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="telephony_config.channels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Number of Channels</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      className="h-9"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          field.onChange(0);
                        } else {
                          const numValue = parseInt(value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }
                      }}
                      value={field.value === 0 ? '' : field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telephony_config.max_concurrent_calls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Max Concurrent Calls</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="1"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      value={field.value || 1}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telephony_config.call_timeout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Call Timeout (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="30"
                      max="3600"
                      placeholder="30"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                      value={field.value || 30}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* STT Configuration */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Speech-to-Text (STT) Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="stt.vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">STT Provider</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedSTTVendor(value);
                      // Reset STT model when vendor changes
                      form.setValue('stt.provider', '');
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select STT provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sttVendors.length > 0 ? (
                        sttVendors.map((v) => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="__no_stt_vendors__">No STT providers loaded</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stt.provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">STT Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select STT model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(() => {
                        const list = getSTTModels(form.watch('stt.vendor') || selectedSTTVendor);
                        return list.length > 0 ? (
                          list.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="__no_stt_models__">No models available</SelectItem>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* STT Language (from external schema, when available) */}
            <FormField
              control={form.control}
              name="stt.language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">STT Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select STT language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(() => {
                        const vendor = form.watch('stt.vendor') || selectedSTTVendor;
                        const model = form.watch('stt.provider');
                        const list = getSTTLanguages(vendor, model);
                        return list.length > 0 ? (
                          list.map((lng) => (
                            <SelectItem key={lng.value} value={lng.value}>{lng.label}</SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="__no_stt_languages__">No languages for model</SelectItem>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="border-t pt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Large Language Model (LLM) Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="llm.provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">LLM Provider</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      console.log('LLM Provider selected:', value);
                      field.onChange(value);
                      setSelectedLLMProvider(value);
                      // Reset LLM model when provider changes
                      form.setValue('llm.model', '');
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select LLM provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {llmProviders.length > 0 ? (
                        llmProviders.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="__no_llm_providers__">No LLM providers loaded</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="llm.model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">LLM Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select LLM model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(() => {
                        const list = getLLMModels(form.watch('llm.provider') || selectedLLMProvider);
                        return list.length > 0 ? (
                          list.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="__no_llm_models__">No models available</SelectItem>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          
          {/* Temperature Slider */}
          <FormField
            control={form.control}
            name="llm.temperature"
            render={({ field }) => {
              const temperatureValue = parseFloat(field.value || '0.7');
              const sliderValue: number[] = [isNaN(temperatureValue) ? 0.7 : temperatureValue];
              
              const getTemperatureDescription = (temp: number) => {
                if (temp < 0.3) return 'Very Precise (Facts, Data Analysis)';
                if (temp < 0.5) return 'Precise (Technical, Accurate)';
                if (temp < 0.7) return 'Balanced (Default, Natural)';
                if (temp < 0.9) return 'Creative (Conversational, Engaging)';
                if (temp < 1.3) return 'Very Creative (Stories, Brainstorming)';
                return 'Highly Random (Experimental)';
              };
              
              const getTemperatureColor = (temp: number) => {
                if (temp < 0.3) return 'text-blue-600';
                if (temp < 0.7) return 'text-green-600';
                if (temp < 1.0) return 'text-yellow-600';
                return 'text-orange-600';
              };
              
              return (
                <FormItem>
                  <div className="space-y-3">
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center justify-between">
                      <span>Temperature (Creativity Control)</span>
                      <span className={`font-semibold ${getTemperatureColor(temperatureValue)}`}>
                        {temperatureValue.toFixed(1)}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2 px-1">
                        <Slider
                          value={sliderValue}
                          onValueChange={(value) => {
                            field.onChange(value[0].toString());
                          }}
                          min={0}
                          max={2}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0.0 (Precise)</span>
                          <span>0.7 (Balanced)</span>
                          <span>2.0 (Creative)</span>
                        </div>
                        <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Current Setting: </span>
                            <span className={getTemperatureColor(temperatureValue)}>
                              {getTemperatureDescription(temperatureValue)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Lower values = more deterministic responses. Higher values = more creative and varied responses.
                          </p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </div>
                </FormItem>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepTelephony; 
