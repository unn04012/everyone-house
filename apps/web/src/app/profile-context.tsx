import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ProfileDraft, type ProfileDraftValues, type ProfileField } from '../profile/profile-draft.js';
import { ProfileStorage } from '../profile/profile-storage.js';

interface ProfileContextValue {
  draft: ProfileDraft;
  setField: <K extends ProfileField>(field: K, value: ProfileDraftValues[K]) => void;
  reset: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children, initial }: { children: ReactNode; initial?: ProfileDraft }) {
  const [draft, setDraft] = useState<ProfileDraft>(() => initial ?? ProfileStorage.load());

  const setField = useCallback(<K extends ProfileField>(field: K, value: ProfileDraftValues[K]) => {
    setDraft((current) => {
      const next = current.with(field, value);
      ProfileStorage.save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    ProfileStorage.clear();
    setDraft(ProfileDraft.empty());
  }, []);

  const value = useMemo<ProfileContextValue>(() => ({ draft, setField, reset }), [draft, setField, reset]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('ProfileProvider 안에서만 쓸 수 있어요');
  }
  return context;
}
