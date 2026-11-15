export interface ClipboardReadResult {
  text: string;
  error?: 'permission-denied' | 'empty';
}

export async function readClipboardLocationText(): Promise<ClipboardReadResult> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return { text: '', error: 'permission-denied' };
  }

  let plainText = '';
  let isPermissionDenied = false;

  try {
    if (navigator.clipboard.readText) {
      plainText = await navigator.clipboard.readText();
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.name === 'NotAllowedError' ||
        err.name === 'SecurityError' ||
        err.message.toLowerCase().includes('denied') ||
        err.message.toLowerCase().includes('not allowed'))
    ) {
      isPermissionDenied = true;
    }
  }

  if (plainText && plainText.trim()) {
    return { text: plainText.trim() };
  }

  if (isPermissionDenied) {
    return { text: '', error: 'permission-denied' };
  }

  if (navigator.clipboard.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of ['text/plain', 'text/html']) {
          if (item.types.includes(type)) {
            try {
              const blob = await item.getType(type);
              const text = await blob.text();
              if (text && text.trim()) return { text: text.trim() };
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.name === 'NotAllowedError' ||
          err.name === 'SecurityError' ||
          err.message.toLowerCase().includes('denied') ||
          err.message.toLowerCase().includes('not allowed'))
      ) {
        return { text: '', error: 'permission-denied' };
      }
    }
  }

  return { text: '', error: 'empty' };
}

