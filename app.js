const Koa = require("koa");
const Router = require("@koa/router");
const Redis = require("ioredis");
const axios = require("axios");
const app = new Koa();
const router = new Router();

const redis = new Redis({
  host: "redis",
  port: 6379,
  password: "",
  db: 1,
});
redis.on("error", function (error) {
  console.error(error);
});

router.get("/todos/:id", async (ctx) => {
  try {
    const cacheTodos = await redis.get(`todos:${ctx.params.id}`);
    if (cacheTodos) {
      console.log("從 Redis 獲得資料");
      ctx.body = JSON.parse(cacheTodos);
      return;
    }

    // 呼叫 API
    const response = await axios.get(`https://jsonplaceholder.typicode.com/todos/${ctx.params.id}`);
    console.log("將第一次獲得的資料儲存到 Redis");
    // 把 API 回傳結果放入 Redis，並設定 5 秒的過期時間（Expire Time）
    await redis.set(`todos:${ctx.params.id}`, JSON.stringify(response.data), "EX", 60);

    ctx.body = response.data;
  } catch (err) {
    ctx.body = err;
  }
});

app.use(router.routes());
app.listen(3000);
