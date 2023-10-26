/** @format */

import express from "express";
const app = express();
const port = 3000;
import middleware from "./middleware.js";
import path from "path";
import * as url from "url";
import bodyParser from "body-parser";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
import session from "express-session";
import database from "./database.js";

app.use(
    session({
        secret: "private-key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public")));

//Routes
import loginRoute from "./routes/loginRoutes.js";
import registerRoute from "./routes/registerRoutes.js";
import logoutRoute from "./routes/logout.js";
import postRoute from "./routes/postRoutes.js";
import profileRoute from "./routes/profileRoutes.js";
import uploadRoute from "./routes/uploadRoutes.js";
import searchRoute from "./routes/searchRoutes.js";
import messagesRoute from "./routes/messagesRoutes.js";
import notificationRoute from "./routes/notificationRoutes.js";

//Api Routes
import postsApiRoute from "./routes/api/posts.js";
import usersApiRoute from "./routes/api/users.js";
import chatsApiRoute from "./routes/api/chats.js";
import messagesApiRoute from "./routes/api/messages.js";
import notificationsRoute from "./routes/api/notifications.js";

app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/posts", middleware.requireLogin, postRoute);
app.use("/profile", middleware.requireLogin, profileRoute);
app.use("/uploads", uploadRoute);
app.use("/search", middleware.requireLogin, searchRoute);
app.use("/messages", middleware.requireLogin, messagesRoute);
app.use("/notifications", middleware.requireLogin, notificationRoute);

app.use("/api/posts", postsApiRoute);
app.use("/api/users", usersApiRoute);
app.use("/api/chats", chatsApiRoute);
app.use("/api/messages", messagesApiRoute);
app.use("/api/notifications", notificationsRoute);

app.get("/", middleware.requireLogin, (req, res, next) => {
    let payload = {
        pageTitle: "Home",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    };
    res.render("home", payload);
});

const server = app.listen(port, () => {
    console.log(`Server Listening on port ` + port);
});

import {Server} from "socket.io";

const io = new Server(server, {pingTimeout: 60000, allowEIO3: false});

io.on("connection", (socket) => {
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("join room", (room) => socket.join(room));
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
    socket.on("notification received", (room) => socket.in(room).emit("notification received"));

    socket.on("new message", (newMessage) => {
        const chat = newMessage.chat;
        if (!chat.users) {
            return console.log("Chat.users not defined");
        }
        chat.users.forEach((user) => {
            if (user._id === newMessage.sender._id) {
                return;
            }
            socket.in(user._id).emit("message received", newMessage);
        });
    });
});
