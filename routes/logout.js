
import express from "express";
const app = express();
const router = express.Router();
app.set("view engine", "pug");
app.set("views", "views");
import User from "../schemas/UserSchema.js";
import bcrypt from "bcrypt";

router.get("/", (req, res, next) => {
   if (req.session) {
        req.session.destroy(()=>{
            res.redirect("/login");
        });
   }
});


export default router;
