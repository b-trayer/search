import { useState, useEffect } from 'react';
import { initialSettingsData } from './types';
import { useSettingsLoader } from './use-settings-loader';
import { useSettingsHandlers } from './use-settings-handlers';
import { useSettingsActions } from './use-settings-actions';

export function useSettingsData() {
  const [data, setData] = useState(initialSettingsData);

  const { loadAll } = useSettingsLoader(setData);
  const handlers = useSettingsHandlers(setData);
  const actions = useSettingsActions(data, setData);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { ...data, ...handlers, ...actions };
}

export * from './types';
