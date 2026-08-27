import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, type SettingItem } from './settings';

export interface SettingsData {
  items: SettingItem[];
  byKey: Record<string, string>;
}

const SETTINGS_KEY = ['settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async (): Promise<SettingsData> => {
      const res = await getSettings();
      const byKey: Record<string, string> = {};
      for (const it of res.items) byKey[it.key] = it.value;
      return { items: res.items, byKey };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, string>) => updateSettings(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
