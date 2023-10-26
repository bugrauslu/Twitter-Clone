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

router.post("/", async (req, res, next) => {
    if (!req.body.content || !req.body.chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }
    const newMessage = {
        sender: req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId,
    };
    Message.create(newMessage)
        .then(async (message) => {
            message = await message.populate("sender");
            message = await message.populate("chat");
            message = await User.populate(message, {path: "chat.users"});
            const chat = await Chat.findByIdAndUpdate(req.body.chatId, {latestMessage: message}).catch((error) => console.log(error));
            
            insertNotifications(chat, message);
            res.status(201).send(message);
        })
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

function insertNotifications(chat, message) {
    chat.users.forEach(async (userId) => {
        if (userId == message.sender._id.toString()) return;
        await Notification.insertNotification(userId, message.sender._id, "newMessage", message.chat._id);
    });
}

export default router;
