const http = require('http');

const PRISM_PORT = 4011;
const LISTEN_PORT = 4010;

const server = http.createServer((req, res) => {
  // Strip /api/v1 prefix if present to support both /api/v1/... and root endpoints
  const path = req.url.startsWith('/api/v1')
    ? req.url.replace('/api/v1', '') || '/'
    : req.url;

  const options = {
    hostname: '127.0.0.1',
    port: PRISM_PORT,
    path,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${PRISM_PORT}` }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Mock proxy connection error', details: err.message }));
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`Mock router listening on port ${LISTEN_PORT}, routing to Prism on ${PRISM_PORT}`);
});
