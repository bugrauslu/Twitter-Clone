
import express from "express";
const app = express();
const router = express.Router();
app.set("view engine", "pug");
app.set("views", "views");
import User from "../schemas/UserSchema.js";
import Chat from "../schemas/ChatSchema.js";
import mongoose from "mongoose";

router.get("/", (req, res, next) => {
    let payload = {
        pageTitle: "Notifications",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    };

    res.status(200).render("notificationsPage", payload);
});



export default router;
