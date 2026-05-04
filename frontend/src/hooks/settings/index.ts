import { useState, useEffect, useMemo } from 'react';
import { initialSettingsData } from './types';
import { useSettingsLoader } from './use-settings-loader';
import { useSettingsHandlers } from './use-settings-handlers';
import { useSettingsActions } from './use-settings-actions';
import { countPendingChanges } from './diff';

export function useSettingsData() {
  const [data, setData] = useState(initialSettingsData);

  const { loadAll } = useSettingsLoader(setData);
  const handlers = useSettingsHandlers(setData);
  const actions = useSettingsActions(data, setData);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const pendingChanges = useMemo(() => countPendingChanges(data), [data]);

  return { ...data, ...handlers, ...actions, pendingChanges };
}

export * from './types';
export * from './diff';
export * from './io';
export * from './changes';
export * from './history';
