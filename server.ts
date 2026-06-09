import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { extractCoordsLocally } from './src/lib/sovereign-digger';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON bodies
  app.use(express.json());

  // API Route for Sovereign Digger proxying to bypass CORS
  app.post('/api/sovereign-digger', async (req, res) => {
    try {
      const { shortUrl } = req.body;

      if (!shortUrl) {
        return res.status(400).json({ error: 'الرابط مفقود' });
      }

      // Group of URLs in redirect chain
      const urlChain: string[] = [shortUrl];
      let currentUrl = shortUrl;
      let hops = 0;

      // 1. Manually follow redirects to avoid Google Consent wall in some locations
      while (hops < 6) {
        try {
          const response = await fetch(currentUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5'
            },
            redirect: 'manual'
          });

          const loc = response.headers.get('location');
          if (loc) {
            const resolvedLoc = new URL(loc, currentUrl).toString();
            urlChain.push(resolvedLoc);
            currentUrl = resolvedLoc;
            hops++;

            if (response.status >= 300 && response.status < 400) {
              continue;
            }
          }
        } catch (fetchErr) {
          console.error("[Sovereign Digger hops error]:", fetchErr);
          break;
        }
        break;
      }

      // 2. Scan parsed URL chain (with decodeURIComponent)
      for (const url of urlChain) {
        const decoded = decodeURIComponent(url);
        const coords = extractCoordsLocally(decoded);
        if (coords) {
          console.log(`[Sovereign Digger Server Chain Success] Extracted: ${coords.lat}, ${coords.lng}`);
          return res.json({ success: true, coords });
        }
      }

      // 3. Jettison fetch follow to scrape the final HTML
      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          },
          redirect: 'follow'
        });

        const finalUrl = response.url;
        const htmlText = await response.text();

        urlChain.push(finalUrl);

        // Check final decoded URL
        const decodedFinalUrl = decodeURIComponent(finalUrl);
        const finalUrlCoords = extractCoordsLocally(decodedFinalUrl);
        if (finalUrlCoords) {
          return res.json({ success: true, coords: finalUrlCoords });
        }

        // Check raw and decoded HTML
        let decodedHtmlText = htmlText;
        try {
          decodedHtmlText = decodeURIComponent(htmlText);
        } catch (e) {
          // ignore parsing error
        }

        const htmlCoords = extractCoordsLocally(htmlText) || extractCoordsLocally(decodedHtmlText);
        if (htmlCoords) {
          return res.json({ success: true, coords: htmlCoords });
        }

      } catch (finalFetchErr: any) {
        console.error("[Sovereign Digger Final Fetch Error]:", finalFetchErr);
      }

      return res.status(404).json({ error: 'تعذر انتزاع الإحداثيات من الرابط المختصر' });

    } catch (error: any) {
      console.error("[Sovereign Digger Server General Error]:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Serve static assets / Vite setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
