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

router.post("/", async (req, res, next) => {
    if (!req.body.users) {
        console.log("Users param not sent with request");
        res.sendStatus(400);
    }

    const users = JSON.parse(req.body.users);
    if (users.length == 0) {
        console.log("Users array is empty");
        res.sendStatus(400);
    }

    users.push(req.session.user);

    const chatData = {
        users: users,
        isGroupChat: true,
    };

    Chat.create(chatData)
        .then((results) => {
            res.status(200).send(results);
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
});

router.get("/", async (req, res, next) => {
    Chat.find({users: {$elemMatch: {$eq: req.session.user._id}}})
    .populate("users")
    .populate("latestMessage")
    .sort({updatedAt: -1})
    .then(async results =>{
        if (req.query.undreadOnly !== undefined && req.query.undreadOnly == "true") {
            results = results.filter(r => !r.latestMessage.readBy.includes(req.session.user._id))
        }
        results = await User.populate(results, {path:"latestMessage.sender"})
        res.status(200).send(results)
    })
    .catch(err=>{
        console.log(err);
        res.sendStatus(400);
    })
});

router.get("/:chatId", async (req, res, next) => {
    Chat.findOne({ _id: req.params.chatId, users: { $elemMatch: { $eq: req.session.user._id } }})
    .populate("users")
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
});

router.put("/:chatId", async (req, res, next) => {
    Chat.findByIdAndUpdate(req.params.chatId, req.body)
    .then(results =>{
        res.sendStatus(204)
    })
    .catch(err=>{
        console.log(err);
        res.sendStatus(400);
    })
});

router.get("/:chatId/messages", async (req, res, next) => {
    Message.find({chat:req.params.chatId})
    .populate("sender")
    .then(results =>{
        res.status(200).send(results)
    })
    .catch(err=>{
        console.log(err);
        res.sendStatus(400);
    })
});
export default router;
