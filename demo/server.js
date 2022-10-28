const Koa = require("koa")
const Router = require("koa-router")
const createWs = require("koa2-ws")
const app = new Koa()
const router = new Router()
const webSocket = createWs()
// 返回一个中间件
app.use(webSocket.middleware)
app.on("error", (err) => {
})

router.get("/ws/:id", async (ctx, next) => {
  const { id } = ctx.params
  // 升级协议 返回当前ws对象 uniqueId为自定义唯一id:
  let ws = await ctx.upgradeWs({
    wsName: "dd",
    uniqueId: id
  })
  if (ws) {
    ws.on("message", (data, isBinary) => {
      console.log(data.toString())
      webSocket.broadcast("给所有已连接的用户广播消息")
    })
  }
  next()
})
app.use(router.routes())
app.listen(3000)
