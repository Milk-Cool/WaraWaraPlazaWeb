import { getWaraWaraData } from "./index.js";
import express from "express";

const app = express();

app.get("/data", async (_req, res) => {
    const data = await getWaraWaraData();
    res.status(200).send(data);
});

app.use(express.static("html"));

app.listen(8062);