# koa2-ws

一个 基于 koa 的 ws 模块,检测在线用户，广播消息等功能，支持 cjs 和 esm

### 安装

`npm i koa-my-ws`

### 基本使用

```js
const Koa = require("koa")
const Router = require("koa-router")
const createWs = require("koa2-ws")
const app = new Koa()
const router = new Router()
const webSocket = createWs()
// 返回一个中间件
app.use(webSocket.middleware)
app.on("error", err => {})

router.get("/ws/:id", async (ctx, next) => {
  const { id } = ctx.params
  // 升级协议 返回当前ws对象 uniqueId为自定义唯一id:
  let ws = await ctx.upgradeWs({
    uniqueId: id
  })
  if (ws) {
    ws.on("message", (data, isBinary) => {
      console.log(data.toString())
      ws.send("发送消息")
      webSocket.broadcast("给所有已连接的用户广播消息")
    })
  }
  next()
})
app.use(router.routes())
app.listen(3000)
```

### 使用配置

```js
const createWs = require("koa2-ws")
const webSocket = createWs({
  clearOfflineWs: true, // 是否清理掉线的客户端
  heartbeatTime: 3000, // 检测时间
  // 传入ws的配置详情 --> https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocketserver
  wsOptions: {
    clientTracking: false,
    maxPayload: 69420
  }
})
// 使用中间件
app.use(webSocket.middleware)
```

### 多个 ws 服务

```js
const Koa = require("koa")
const Router = require("koa-router")
const createWs = require("koa2-ws")
const app = new Koa()
const router = new Router()
const webSocket1 = createWs({ wsName: "ws1" })
const webSocket2 = createWs({ wsName: "ws2" })
// 返回一个中间件
app.use(webSocket1.middleware)
app.use(webSocket2.middleware)

app.on("error", err => {})

router.get("/ws1/:id", async (ctx, next) => {
  const { id } = ctx.params
  // 升级协议 返回当前ws对象 uniqueId为自定义唯一id:
  let ws = await ctx.upgradeWs({
    wsName:"ws1"
    uniqueId: id
  })
  if (ws) {
    ws.on("message", (data, isBinary) => {
      console.log(data.toString())
      ws.send("发送消息")
      webSocket1.broadcast("给所有已连接的用户广播消息")
    })
  }
  next()
})

router.get("/ws2/:id", async (ctx, next) => {
  const { id } = ctx.params
  // 升级协议 返回当前ws对象 uniqueId为自定义唯一id:
  let ws = await ctx.upgradeWs({
    wsName:"ws2"
    uniqueId: id
  })
  if (ws) {
    ws.on("message", (data, isBinary) => {
      console.log(data.toString())
      ws.send("发送消息")
      webSocket2.broadcast("给所有已连接的用户广播消息")
    })
  }
  next()
})
app.use(router.routes())
app.listen(3000)
```

### 获取客户端 client

获取连接的 webSocket 实例 [Class: WebSocket](https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocket)

- `webSocket.getClient(uniqueId)` 根据创建连接时的 uniqueId 获取客户端，必须搭配 uniqueId 使用
- `webSocket.getClients()` 获取所有客户端

### 广播消息

`webSocket.broadcast(data,options,callback)` 给所有用户广播消息,内部调用 [ws.send 方法](https://github.com/websockets/ws/blob/master/doc/ws.md#websocketsenddata-options-callback)

### 获取服务 wsServer

`webSocket.wsServer` [Class: WebSocketServer](https://github.com/websockets/ws/blob/master/doc/ws.md#event-close)
