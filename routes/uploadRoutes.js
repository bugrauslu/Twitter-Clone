
import express from "express";
const app = express();
const router = express.Router();
app.set("view engine", "pug");
app.set("views", "views");
import User from "../schemas/UserSchema.js";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
import path from "path";
import fs from "fs";

router.get("/images/:path", (req, res, next) => {
    res.sendFile(path.join(__dirname, "../uploads/images/" + req.params.path));
})


export default router;