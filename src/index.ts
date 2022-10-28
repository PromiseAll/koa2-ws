import { WebSocket, WebSocketServer } from "ws"
const wsServerMap = new Map()

// 创建中间件
const createMiddleware = (wsServer: WebSocketServer) => {
  return async (ctx, next) => {
    const upgradeHeader = (ctx.request.headers.upgrade || "").split(",").map(s => s.trim().toLowerCase())
    ctx.upgradeWs = ({ wsName = "ws", uniqueId = null, state = {} } = {}) => {
      return new Promise((resolve, reject) => {
        if (upgradeHeader.includes("websocket")) {
          wsServerMap.get(wsName).handleUpgrade(ctx.req, ctx.req.socket, Buffer.alloc(0), ws => {
            ws.uniqueId = uniqueId
            ws.state = state
            resolve(ws)
            wsServer.emit("connection", ws, ctx.req)
          })
          ctx.respond = false
        } else {
          reject("upgrade is not websocket")
        }
      })
    }
    await next()
  }
}

/**
 * @description: 创建工具方法-根据uniqueId获取客户端
 * @param {string} uniqueId
 * @return {*}
 */
const createGetClientFn = (wsServer: WebSocketServer) => {
  const fn = (uniqueId: string): WebSocket | undefined => {
    if (uniqueId) {
      return Array.from(wsServer.clients).find((ws: any) => ws.uniqueId == uniqueId)
    }
  }
  return fn
}

/**
 * @description: 创建工具方法-获取所有客户端
 * @return {Array<WebSocket>}
 */
const createGetClientsFn = (wsServer: WebSocketServer) => {
  const fn = (): Array<WebSocket> => {
    return Array.from(wsServer.clients)
  }
  return fn
}

/**
 * @description: 创建工具方法-广播所有人
 * @return {*}
 */
const createBroadcastFn = (wsServer: WebSocketServer) => {
  const fn = function (data: any, options: { mask?: boolean | undefined; binary?: boolean | undefined; compress?: boolean | undefined; fin?: boolean | undefined }, cb?: (err?: Error) => void) {
    wsServer.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, options, cb)
      }
    })
  }
  return fn
}

// 创建ws服务
const createWs = ({ wsName = "ws", clearOfflineWs = true, heartbeatTime = 3000, wsOptions = {} } = {}) => {
  const wsServer = new WebSocketServer({ ...wsOptions, noServer: true })
  wsServerMap.set(wsName, wsServer)
  const middleware = createMiddleware(wsServer)

  const options = {
    wsServer,
    middleware,
    getClient: createGetClientFn(wsServer),
    getClients: createGetClientsFn(wsServer),
    broadcast: createBroadcastFn(wsServer)
  }

  // 心跳检测，移除除掉线用户
  if (clearOfflineWs && heartbeatTime) {
    setInterval(() => {
      wsServer.clients.forEach((ws: WebSocket) => {
        if (ws.readyState > ws.OPEN) {
          wsServer.clients.delete(ws)
          return
        }
        ws.ping((err: any) => {
          if (err) wsServer.clients.delete(ws)
        })
      })
    }, heartbeatTime)
  }
  return options
}

export = createWs
// export default createWs
