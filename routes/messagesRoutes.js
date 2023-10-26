/** @format */

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
        pageTitle: "inbox",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    };

    res.status(200).render("inboxPage", payload);
});

router.get("/new", (req, res, next) => {
    let payload = {
        pageTitle: "newMessage",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    };

    res.status(200).render("newMessage", payload);
});

router.get("/:chatId", async (req, res, next) => {
  
    var userId = req.session.user._id;
    var chatId = req.params.chatId;
    var isValidId = mongoose.isValidObjectId(chatId);


    var payload = {
        pageTitle: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    };

    if(!isValidId) {
        payload.errorMessage = "Chat does not exist or you do not have permission to view it.";
        return res.status(200).render("chatPage", payload);
    }

    var chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } })
    .populate("users");

    if(chat == null) {
        // Check if chat id is really user id
        var userFound = await User.findById(chatId);

        if(userFound != null) {
            // get chat using user id
            chat = await getChatByUserId(userFound._id, userId);
        }
    }

    if(chat == null) {
        payload.errorMessage = "Chat does not exist or you do not have permission to view it.";
    }
    else {
        payload.chat = chat;
    }

    res.status(200).render("chatPage", payload);
});

function getChatByUserId(userLoggedInId, otherUserId) {
    return Chat.findOneAndUpdate({
        isGroupChat: false,
        users: {
            $size: 2,
            $all: [
                {$elemMatch: {$eq: userLoggedInId}},
                {$elemMatch: {$eq: otherUserId}}
            ],
        },
    },
    {
        $setOnInsert:{
            users:[userLoggedInId,otherUserId]
        }
    },
    {
        new:true , upsert:true
    })
    .populate("users");
}

export default router;
