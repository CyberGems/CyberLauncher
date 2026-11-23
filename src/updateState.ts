export const SKIPPED_UPDATE_KEY = 'cyberlauncher_skipped_update_version';

export function isSkippedUpdateVersion(version: string, skipped: string | null): boolean {
  const normalize = (value: string) => value.trim().toLowerCase().replace(/^v+/, '');
  return skipped !== null && normalize(version) === normalize(skipped);
}

interface UpdateRelease {
  version: string;
  releaseUrl: string;
  releaseNotes?: string;
  notesLoading?: boolean;
  portableUrl?: string;
}

export type PendingUpdate = { release: UpdateRelease } & (
  | { state: 'available'; downloadFailed?: boolean }
  | { state: 'downloading'; percent: number; transferred?: number; total?: number; cancelling?: boolean }
  | { state: 'downloaded'; installFailed?: boolean }
  | { state: 'installing' }
);

export type UpdateCheckResult =
  | { ok: true; available: false }
  | { ok: true; available: true; version: string }
  | { ok: false; error: string };
