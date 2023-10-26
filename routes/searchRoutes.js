
import express from "express";
const app = express();
const router = express.Router();
app.set("view engine", "pug");
app.set("views", "views");
import User from "../schemas/UserSchema.js";


router.get("/", (req, res, next) => {
    let payload = createPayload(req.session.user)
    res.status(200).render("searchPage", payload);
})

router.get("/:selectedTab", (req, res, next) => {
    let payload = createPayload(req.session.user)
    payload.selectedTab = req.params.selectedTab;
    res.status(200).render("searchPage", payload);
})

function createPayload(userLoggedIn) {
    return {
        pageTitle: "Search",
        userLoggedIn: userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn)
    };
}

export default router;