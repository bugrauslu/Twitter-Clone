
import express from "express";
const app = express();
const router = express.Router();
app.set("view engine", "pug");
app.set("views", "views");
import User from "../schemas/UserSchema.js";
import bcrypt from "bcrypt";

router.get("/:id", (req, res, next) => {

    let payload = {
        pageTitle: "View Post",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        postId: req.params.id
    };
    res.status(200).render("postPage",payload);
});



export default router;
