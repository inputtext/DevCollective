process.env.WS_PORT ||= process.env.PORT || '3001';

const { startWebSocketServer } = await import('./server/websocket');
startWebSocketServer();
