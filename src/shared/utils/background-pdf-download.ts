/**
 * Web Worker-Powered Silent PDF Downloader
 * 
 * Offloads binary network streaming and buffer parsing to a dedicated background
 * Web Worker thread, ensuring zero main-thread UI blockage or frame drops.
 */

export async function downloadPdfInWorker(options: {
  url: string;
  filename: string;
}): Promise<void> {
  const { url, filename } = options;

  if (typeof window === 'undefined') return;

  // Check if Web Worker is supported
  const hasWorkerSupport = typeof window.Worker !== 'undefined';

  if (!hasWorkerSupport) {
    // Fallback: main-thread async fetch
    await fallbackMainThreadDownload(url, filename);
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
            var res = await fetch(data.url, { cache: 'no-store' });
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
            console.warn('[PDF Worker] Worker reported failure, using fallback:', e.data.error);
            fallbackMainThreadDownload(url, filename).then(resolve).catch(reject);
          }
        } finally {
          cleanup();
        }
      };

      worker.onerror = (err) => {
        console.warn('[PDF Worker] Worker runtime error, using fallback:', err);
        cleanup();
        fallbackMainThreadDownload(url, filename).then(resolve).catch(reject);
      };

      worker.postMessage({ url, filename });
    } catch (workerInitErr) {
      console.warn('[PDF Worker] Worker init failed, using fallback:', workerInitErr);
      cleanup();
      fallbackMainThreadDownload(url, filename).then(resolve).catch(reject);
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

async function fallbackMainThreadDownload(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch file: ' + res.status);
    const buf = await res.arrayBuffer();
    triggerFileSave(buf, filename);
  } catch (err) {
    console.warn('[PDF Download Fallback] Direct fetch failed, attempting silent iframe:', err);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  }
}

