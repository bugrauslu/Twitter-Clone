/** @format */

import express from "express";
const app = express();
const router = express.Router();
import User from "../schemas/UserSchema.js";
import bcrypt from "bcrypt";

app.set("view engine", "pug");
app.set("views", "views");

router.get("/", (req, res, next) => {
    res.render("register");
});

router.post("/", async (req, res, next) => {
    const {firstName, lastName, username, email, password, passwordConf} = req.body;
    let payload = req.body;

    if (firstName.trim() && lastName.trim() && username.trim() && email.trim() && password.trim()) {
      const user = await  User.findOne({
            $or: [{username: username}, {email: email}],
        }).catch((error)=>{
            console.log(error);
            payload.errorMessage = "Something went wrong";
            res.status(200).render("register", payload);
        })

    if (user == null) {
            const data = req.body;
            data.password = await bcrypt.hash(password,10);
            User.create(data)
            .then((user)=>{
                req.session.user = user;
                res.redirect('/');
            }).catch((err)=>{
                console.log(err)
            })
    }else{
        if (email == user.email) {
            payload.errorMessage = "Email already in use.";
        }else{
            payload.errorMessage = "Username already in use.";
        }
        res.status(200).render("register", payload);
    }
      
    } else {
        payload.errorMessage = "make sure each field has a vaild value.";
        res.render("register", payload);
    }
});

export default router;
