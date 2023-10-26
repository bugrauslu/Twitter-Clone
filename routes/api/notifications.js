/** @format */

import express from "express";
const app = express();
const router = express.Router();
app.set("view engine", "pug");
app.set("views", "views");
import User from "../../schemas/UserSchema.js";
import Post from "../../schemas/PostSchema.js";
import Chat from "../../schemas/ChatSchema.js";
import Message from "../../schemas/MessagesSchema.js";
import Notification from "../../schemas/NotificationSchema.js";

router.get("/", async (req, res, next) => {
    let searchObject = {userTo: req.session.user._id, notificationType: {$ne: "newMessage"}};

    if (req.query.undreadOnly !== undefined && req.query.undreadOnly == "true") {
        searchObject.opened = false;
    }

    Notification.find(searchObject)
        .populate("userTo")
        .populate("userFrom")
        .sort({createdAt: -1})
        .then((results) => {
            res.status(200).send(results);
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
});

router.get("/latest", async (req, res, next) => {
    Notification.findOne({userTo: req.session.user._id})
        .populate("userTo")
        .populate("userFrom")
        .sort({createdAt: -1})
        .then((results) => {
            res.status(200).send(results);
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
});

router.put("/:id/markAsOpened", async (req, res, next) => {
    Notification.findByIdAndUpdate(req.params.id, {opened: true})
        .then(() => {
            res.sendStatus(200);
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
});

router.put("/markAsOpened", async (req, res, next) => {
    Notification.updateMany({userTo: req.session.user._id}, {opened: true})
        .then(() => {
            res.sendStatus(200);
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
});

export default router;
