const http = require('http');
const https = require('https');

const PORT = 3001;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, authorization, content-type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(req.url.substring(6)); // remove "/?url=" and decode
  } catch(e) {
    res.writeHead(400);
    return res.end('Invalid URL encoding');
  }

  if (!targetUrl.startsWith('http')) {
    res.writeHead(400);
    return res.end('Invalid URL');
  }

  const options = {
    headers: {
      'x-api-key': req.headers['x-api-key'] || '',
      'Authorization': req.headers['authorization'] || '',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36'
    }
  };

  try {
    const client = targetUrl.startsWith('https') ? https : http;
    console.log(`[PROXY] Fetching: ${targetUrl}`);
    client.get(targetUrl, options, (proxyRes) => {
      // Delete headers that might cause CORS issues
      delete proxyRes.headers['access-control-allow-origin'];
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      
      let bodyData = '';
      if (targetUrl.includes('/community/farms/')) {
        proxyRes.on('data', chunk => bodyData += chunk);
        proxyRes.on('end', () => {
          require('fs').writeFileSync('data/farm.json', bodyData);
        });
      }
      
      proxyRes.pipe(res);
      console.log(`[PROXY] Success: ${proxyRes.statusCode}`);
    }).on('error', (err) => {
      console.error(`[PROXY] Error: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end(err.message);
      }
    });
  } catch(e) {
    console.error(`[PROXY] Exception: ${e.message}`);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Proxy Error');
    }
  }
}).listen(PORT, () => {
  console.log(`CORS Proxy running on http://localhost:${PORT}`);
});
