
import express from "express";
const app = express();
const router = express.Router();
app.set("view engine", "pug");
app.set("views", "views");
import User from "../schemas/UserSchema.js";
import bcrypt from "bcrypt";

router.get("/", (req, res, next) => {
    res.render("login");
});

router.post("/", async (req, res, next) => {
    let payload = req.body;
    if (req.body.logUsername && req.body.logPassword) {
       
        const user = await User.findOne({
            $or: [{username: req.body.logUsername}, {email: req.body.logUsername}],
        }).catch((error) => {
            console.log(error);
            payload.errorMessage = "Something went wrong";
            return res.status(200).render("login", payload);
        });
        if (user != null) {
            const resultPasswordCompare = await bcrypt.compare(req.body.logPassword, user.password);
            if (resultPasswordCompare === true) {
                req.session.user = user;
                return res.redirect("/");
            }else{
                console.log("password ıncorrect")
            }
        }
        payload.errorMessage = "login credentials incorrect";
        return res.status(200).render("login", payload);
    }
    payload.errorMessage = "Make sure each field has a valid value";
    res.status(200).render("login",payload);
});

export default router;
