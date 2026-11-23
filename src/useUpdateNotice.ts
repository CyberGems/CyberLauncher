import { useCallback, useEffect, useRef, useState } from 'react';
import { isSkippedUpdateVersion, SKIPPED_UPDATE_KEY, type PendingUpdate } from './updateState';

export function useUpdateNotice(automaticNoticesEnabled: boolean) {
  const [status, setStatus] = useState<PendingUpdate | null>(null);
  const [manualVersion, setManualVersion] = useState<string | null>(null);
  const [hiddenStage, setHiddenStage] = useState<string | null>(null);
  const [skippedVersion, setSkippedVersion] = useState(() => {
    try { return localStorage.getItem(SKIPPED_UPDATE_KEY); }
    catch { return null; }
  });
  const noticeRef = useRef<HTMLDivElement | null>(null);
  const focusNextNotice = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const version = status?.release.version;
  const pending = version && (
    version === manualVersion ||
    (automaticNoticesEnabled && !isSkippedUpdateVersion(version, skippedVersion))
  ) ? status : null;
  const stage = pending ? `${pending.state === 'installing' ? 'downloaded' : pending.state}:${version}` : null;
  const visible = Boolean(stage && stage !== hiddenStage);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    let active = true;
    let receivedEvent = false;
    const unsubscribe = api.onUpdateStatus(next => {
      receivedEvent = true;
      setStatus(next);
      setManualVersion(manual => manual === next?.release.version ? manual : null);
      if (!next) setHiddenStage(null);
    });
    void api.getUpdateStatus().then(snapshot => {
      if (active && !receivedEvent) setStatus(snapshot);
    }).catch(error => console.warn('[Updater] Could not read the update status:', error));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const attach = useCallback((element: HTMLDivElement | null) => {
    noticeRef.current = element;
    if (element && focusNextNotice.current) {
      focusNextNotice.current = false;
      element.focus();
    }
  }, []);

  const open = useCallback((requestedVersion?: string) => {
    if (requestedVersion) setManualVersion(requestedVersion);
    setHiddenStage(null);
    const active = document.activeElement;
    if (active instanceof HTMLElement && !noticeRef.current?.contains(active)) {
      openerRef.current = active;
    }
    if (noticeRef.current) noticeRef.current.focus();
    else focusNextNotice.current = true;
  }, []);

  const dismiss = () => {
    setHiddenStage(stage);
    openerRef.current?.focus();
    openerRef.current = null;
  };

  const skip = (skipped: string) => {
    try { localStorage.setItem(SKIPPED_UPDATE_KEY, skipped); }
    catch (error) { console.warn('[Updater] Could not save the skipped version:', error); }
    setSkippedVersion(skipped);
    setManualVersion(null);
    dismiss();
  };

  const download = async (target: string) => {
    if (isSkippedUpdateVersion(target, skippedVersion)) {
      try { localStorage.removeItem(SKIPPED_UPDATE_KEY); }
      catch (error) { console.warn('[Updater] Could not clear the skipped version:', error); }
      setSkippedVersion(null);
    }
    setManualVersion(target);
    await window.electronAPI?.downloadUpdate(target);
  };

  return { pending, stage, visible, attach, open, dismiss, skip, download };
}
