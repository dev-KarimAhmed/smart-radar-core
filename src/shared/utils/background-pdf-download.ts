/**
 * Web Worker-Powered Silent PDF Downloader
 * 
 * Offloads binary network streaming and buffer parsing to a dedicated background
 * Web Worker thread, ensuring zero main-thread UI blockage or frame drops.
 */

export async function downloadPdfInWorker(options: {
  url: string;
  filename: string;
  accessToken?: string;
}): Promise<void> {
  const { url, filename, accessToken } = options;

  if (typeof window === 'undefined') return;

  // Check if Web Worker is supported
  const hasWorkerSupport = typeof window.Worker !== 'undefined';

  if (!hasWorkerSupport) {
    // Fallback: main-thread async fetch
    await fallbackMainThreadDownload(url, filename, accessToken);
    return;
  }

  return new Promise<void>((resolve, reject) => {
    let worker: Worker | null = null;
    let objectUrl: string | null = null;

    try {
      const workerScript = `
        self.onmessage = async function(e) {
          var data = e.data;
          try {
            var fetchOpts = { cache: 'no-store' };
            if (data.accessToken) {
              fetchOpts.headers = { Authorization: 'Bearer ' + data.accessToken };
            }
            var res = await fetch(data.url, fetchOpts);
            if (!res.ok) {
              throw new Error('HTTP ' + res.status + ' ' + res.statusText);
            }
            var buffer = await res.arrayBuffer();
            self.postMessage({ success: true, buffer: buffer, filename: data.filename }, [buffer]);
          } catch (err) {
            self.postMessage({ success: false, error: err.message || String(err) });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      objectUrl = window.URL.createObjectURL(blob);
      worker = new Worker(objectUrl);

      worker.onmessage = (e: MessageEvent) => {
        try {
          if (e.data.success && e.data.buffer) {
            triggerFileSave(e.data.buffer, e.data.filename || filename);
            resolve();
          } else {
            console.warn('[PDF Worker] Worker reported failure, using authenticated fallback:', e.data.error);
            fallbackMainThreadDownload(url, filename, accessToken).then(resolve).catch(reject);
          }
        } finally {
          cleanup();
        }
      };

      worker.onerror = (err) => {
        console.warn('[PDF Worker] Worker runtime error, using authenticated fallback:', err);
        cleanup();
        fallbackMainThreadDownload(url, filename, accessToken).then(resolve).catch(reject);
      };

      worker.postMessage({ url, filename, accessToken });
    } catch (workerInitErr) {
      console.warn('[PDF Worker] Worker init failed, using authenticated fallback:', workerInitErr);
      cleanup();
      fallbackMainThreadDownload(url, filename, accessToken).then(resolve).catch(reject);
    }

    function cleanup() {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    }
  });
}

function triggerFileSave(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);
}

async function fallbackMainThreadDownload(
  url: string,
  filename: string,
  accessToken?: string,
): Promise<void> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const res = await fetch(url, { cache: 'no-store', headers });
  if (!res.ok) {
    throw new Error('Failed to fetch PDF file: ' + res.status);
  }
  const buf = await res.arrayBuffer();
  triggerFileSave(buf, filename);
}
