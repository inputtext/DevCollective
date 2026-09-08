process.env.WS_PORT ||= process.env.PORT || '3001';

const { startWebSocketServer } = await import('./server/websocket');
const httpServer = startWebSocketServer();

httpServer.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ status: 'ok', service: 'websocket', timestamp: new Date().toISOString() }));
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});
