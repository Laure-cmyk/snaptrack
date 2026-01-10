#!/usr/bin/env node

import 'dotenv/config';
import createDebugger from 'debug';
import http from 'node:http';
import { WSServerRoomManager, WSServerRoom } from 'wsmini';

import app from '../app.js';
import connectDB from '../config/database.js';

const debug = createDebugger('snaptrack:server');

// Get port from environment and store in Express
const port = normalizePort(process.env.PORT || '10000');
app.set('port', port);

// Connect to MongoDB
await connectDB();

// Create HTTP server
const httpServer = http.createServer(app);

// WebSocket Server - attached to HTTP server for Render compatibility (single port)
const wsServer = new WSServerRoomManager({
  origins: '*',
  maxUsersByRoom: 50,
  roomClass: class extends WSServerRoom {
    onJoin(msg, clientMeta) {
      return { username: msg.username || 'User' };
    }

    onCmdLocation(data, clientMeta) {
      return {
        username: clientMeta.username,
        lat: data.lat,
        lng: data.lng
      };
    }
  },
  usersCanCreateRoom: true
});

// Attach WebSocket to HTTP server (same port)
wsServer.start({ server: httpServer });

// Listen on provided port, on all network interfaces
httpServer.listen(port);
httpServer.on('error', onHttpServerError);
httpServer.on('listening', onHttpServerListening);

// Graceful shutdown
process.on('SIGTERM', () => {
  debug('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    debug('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  debug('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    debug('HTTP server closed');
    process.exit(0);
  });
});

// Normalize a port into a number, string, or false
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onHttpServerError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}

function onHttpServerListening() {
  const addr = httpServer.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}
