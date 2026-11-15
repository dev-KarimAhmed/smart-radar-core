export const deletedNotificationIds = new Set<string>();

export function getDeletedNotificationIds(userId: string | null): Set<string> {
  const set = new Set<string>(deletedNotificationIds);
  if (!userId || typeof window === 'undefined') return set;
  try {
    const raw = localStorage.getItem(`radar_deleted_notifs_${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => set.add(String(id)));
      }
    }
  } catch {}
  return set;
}

export function persistDeletedNotificationIds(userId: string | null, ids: string[]): void {
  if (!userId || typeof window === 'undefined' || ids.length === 0) return;
  try {
    const key = `radar_deleted_notifs_${userId}`;
    const existing = getDeletedNotificationIds(userId);
    ids.forEach((id) => {
      deletedNotificationIds.add(id);
      existing.add(id);
    });
    const arr = Array.from(existing).slice(-200);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}
