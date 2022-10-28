"use strict";

// src/index.ts
var import_ws = require("ws");
var wsServerMap = /* @__PURE__ */ new Map();
var createMiddleware = (wsServer) => {
  return async (ctx, next) => {
    const upgradeHeader = (ctx.request.headers.upgrade || "").split(",").map((s) => s.trim().toLowerCase());
    ctx.upgradeWs = ({ wsName = "ws", uniqueId = null, state = {} } = {}) => {
      return new Promise((resolve, reject) => {
        if (upgradeHeader.includes("websocket")) {
          wsServerMap.get(wsName).handleUpgrade(ctx.req, ctx.req.socket, Buffer.alloc(0), (ws) => {
            ws.uniqueId = uniqueId;
            ws.state = state;
            resolve(ws);
            wsServer.emit("connection", ws, ctx.req);
          });
          ctx.respond = false;
        } else {
          reject("upgrade is not websocket");
        }
      });
    };
    await next();
  };
};
var createGetClientFn = (wsServer) => {
  const fn = (uniqueId) => {
    if (uniqueId) {
      return Array.from(wsServer.clients).find((ws) => ws.uniqueId == uniqueId);
    }
  };
  return fn;
};
var createGetClientsFn = (wsServer) => {
  const fn = () => {
    return Array.from(wsServer.clients);
  };
  return fn;
};
var createBroadcastFn = (wsServer) => {
  const fn = function(data, options, cb) {
    wsServer.clients.forEach((client) => {
      if (client.readyState === import_ws.WebSocket.OPEN) {
        client.send(data, options, cb);
      }
    });
  };
  return fn;
};
var createWs = ({ wsName = "ws", clearOfflineWs = true, heartbeatTime = 3e3, wsOptions = {} } = {}) => {
  const wsServer = new import_ws.WebSocketServer({ ...wsOptions, noServer: true });
  wsServerMap.set(wsName, wsServer);
  const middleware = createMiddleware(wsServer);
  const options = {
    wsServer,
    middleware,
    getClient: createGetClientFn(wsServer),
    getClients: createGetClientsFn(wsServer),
    broadcast: createBroadcastFn(wsServer)
  };
  if (clearOfflineWs && heartbeatTime) {
    setInterval(() => {
      wsServer.clients.forEach((ws) => {
        if (ws.readyState > ws.OPEN) {
          wsServer.clients.delete(ws);
          return;
        }
        ws.ping((err) => {
          if (err)
            wsServer.clients.delete(ws);
        });
      });
    }, heartbeatTime);
  }
  return options;
};
module.exports = createWs;
