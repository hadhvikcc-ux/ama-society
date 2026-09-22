const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || process.env.PORT || '8443', 10);
const METRO_PORT = parseInt(process.env.METRO_PORT || '8081', 10);
const API_PORT = parseInt(process.env.API_PORT || '3000', 10);

const certDir = path.resolve(__dirname, '../.cert');
const certPath = path.join(certDir, 'cert.pem');
const keyPath = path.join(certDir, 'key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('❌ SSL certificate files not found in:', certDir);
  console.error('Please generate them before starting the HTTPS proxy.');
  process.exit(1);
}

const sslOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

function getTargetPort(url) {
  if (url && (url.startsWith('/api') || url.startsWith('/socket.io'))) {
    return API_PORT;
  }
  return METRO_PORT;
}

const server = https.createServer(sslOptions, (req, res) => {
  const targetPort = getTargetPort(req.url || '/');
  
  const headers = { ...req.headers };
  headers['host'] = `127.0.0.1:${targetPort}`;
  headers['x-forwarded-proto'] = 'https';
  headers['x-forwarded-port'] = `${HTTPS_PORT}`;
  headers['x-forwarded-host'] = req.headers.host || `localhost:${HTTPS_PORT}`;
  headers['x-forwarded-for'] = req.socket.remoteAddress || '127.0.0.1';

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: headers,
    },
    (proxyRes) => {
      // Forward headers and status code
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`[Proxy Error] Request to port ${targetPort} failed: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>502 Bad Gateway - AMA</title></head>
        <body style="font-family:system-ui,sans-serif;padding:40px;background:#f8fafc;color:#1e293b;text-align:center;">
          <h2 style="color:#ef4444;font-size:24px;">502 Bad Gateway</h2>
          <p>The AMA development service on target port <strong>${targetPort}</strong> is still starting up or not running.</p>
          <p style="color:#64748b;font-size:14px;">Target: http://127.0.0.1:${targetPort}${req.url}</p>
          <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Retry</button>
        </body>
        </html>
      `);
    }
  });

  req.pipe(proxyReq);
});

// Upgrade WebSocket connections for Metro HMR / Hot Reloading
server.on('upgrade', (req, socket, head) => {
  const targetPort = getTargetPort(req.url || '/');

  const headers = { ...req.headers };
  headers['host'] = `127.0.0.1:${targetPort}`;
  headers['x-forwarded-proto'] = 'https';

  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: headers,
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    const rawHeaders = Object.entries(proxyRes.headers)
      .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}\r\n`)
      .join('');

    socket.write(
      `HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n${rawHeaders}\r\n`
    );

    if (proxyHead && proxyHead.length) {
      socket.write(proxyHead);
    }
    if (head && head.length) {
      proxySocket.write(head);
    }

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);

    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
  });

  proxyReq.on('error', (err) => {
    console.error(`[WebSocket Proxy Error] Port ${targetPort}: ${err.message}`);
    socket.destroy();
  });

  proxyReq.end();
});

server.listen(HTTPS_PORT, () => {
  console.log(`
======================================================================
 🚀 AMA Secure HTTPS Web Server Running!
 
  👉 URL:             https://localhost:${HTTPS_PORT}
  👉 Alternate URL:   https://127.0.0.1:${HTTPS_PORT}
  
  🔒 TLS Certificate: ${certPath}
  🔄 Forwarding:
     • Web Client & HMR -> http://127.0.0.1:${METRO_PORT}
     • API & Sockets    -> http://127.0.0.1:${API_PORT}
     
  💡 Browser Security Notice:
     Because this uses a local self-signed certificate, your browser
     may show "Your connection is not private".
     Click "Advanced" -> "Proceed to localhost (unsafe)" to continue.
======================================================================
  `);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
