import express, { json } from "express";
import { Redis } from "ioredis";
import fs from "fs";

const app = express();
const router = express.Router();

const redis = new Redis({
  host: "redis",
  port: 6379,
  password: "",
  db: 1,
});

app.use(express.json({}));
app.use(express.urlencoded({ extended: false }));

router.get("/todos/:id", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const data = await redis.get(`todos:${req.params.id}`);
    if (data) {
      console.log("from redis");
      res.status(200).json({
        data: JSON.parse(data),
        message: "Data retrieved from Redis",
      });
      return;
    }

    fs.readFile("./data/data.json", (error, fileData) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      const jsonData = JSON.parse(fileData.toString());
      const result = jsonData[+req.params.id - 1];

      redis.set(`todos:${req.params.id}`, JSON.stringify(result), "EX", 10);

      res.status(200).json({
        data: result,
        message: "Data fetched from external API",
      });
    });
  } catch (err) {
    next(err);
  }
});

router.put("/todos/:id", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  fs.readFile("./data/data.json", (err, data) => {
    if (err) {
      console.log(err);
      res.status(400).json({
        message: `can't not find data`,
      });
      return next(err);
    }

    let dataObj = JSON.parse(data.toString());
    dataObj[+req.params.id - 1] = req.body;

    const finalData = JSON.stringify(dataObj);
    fs.writeFile("./data/data.json", finalData, (err) => {
      if (err) {
        console.log(err);
        return next(err);
      }
    });
    res.status(200).json({ status: "success" });
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.use(router);

app.listen(3000, () => {
  console.log("Server started on port 3000!");
});
