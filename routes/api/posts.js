/** @format */

import express from "express";
const app = express();
const router = express.Router();
app.set("view engine", "pug");
app.set("views", "views");
import User from "../../schemas/UserSchema.js";
import Post from "../../schemas/PostSchema.js";
import Notification from "../../schemas/NotificationSchema.js";

router.get("/", async (req, res, next) => {
    let searchObj = req.query;

    if (searchObj.isReply !== undefined) {
        let isReply = searchObj.isReply == "true";
        searchObj.replyTo = {$exists: isReply};
        delete searchObj.isReply;
    }

    if(searchObj.search !== undefined) {
        searchObj.content = { $regex: searchObj.search, $options: "i" };
        delete searchObj.search;
    }

    if (searchObj.followingOnly !== undefined) {
        var followingOnly = searchObj.followingOnly == "true";

        if (followingOnly) {
            var objectIds = [];

            if (!req.session.user.following) {
                req.session.user.following = [];
            }

            req.session.user.following.forEach((user) => {
                objectIds.push(user);
            });

            objectIds.push(req.session.user._id);
            searchObj.postedBy = {$in: objectIds};
        }

        delete searchObj.followingOnly;
    }

    const results = await getPosts(searchObj);
    res.status(200).send(results);
});

router.get("/:id", async (req, res, next) => {
    const postId = req.params.id;
    let postData = await getPosts({_id: postId});
    postData = postData[0];

    const results = {
        postData: postData,
    };
    if (postData.replyTo !== undefined) {
        results.replyTo = postData.replyTo;
    }

    results.replies = await getPosts({replyTo: postId});
    res.status(200).send(results);
});

router.post("/", async (req, res, next) => {
    if (!req.body.content) {
        console.log("Content param not sent with request");
        return res.sendStatus(400);
    }
    const postData = {
        content: req.body.content,
        postedBy: req.session.user,
    };

    if (req.body.replyTo) {
        postData.replyTo = req.body.replyTo;
    }

    Post.create(postData)
        .then(async (newPost) => {
            newPost = await User.populate(newPost, {path: "postedBy"});
            newPost = await Post.populate(newPost, {path: "replyTo"});
            if (newPost.replyTo !== undefined) {
                await Notification.insertNotification(newPost.replyTo.postedBy , req.session.user._id ,"reply", newPost._id)
            }

            res.status(201).send(newPost);
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
});

router.put("/:id/like", async (req, res, next) => {
    const postId = req.params.id;
    const userId = req.session.user._id;

    let isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    const option = isLiked ? "$pull" : "$addToSet";
    req.session.user = await User.findByIdAndUpdate(userId, {[option]: {likes: postId}}, {new: true}).catch((err) => {
        console.log(err);
        res.sendStatus(400);
    });

    const post = await Post.findByIdAndUpdate(postId, {[option]: {likes: userId}}, {new: true}).catch((err) => {
        console.log(err);
        res.sendStatus(400);
    });

    if (!isLiked) {
        await Notification.insertNotification(post.postedBy , userId ,"postLike", post._id)
    }

    res.status(200).send(post);
});

router.post("/:id/retweet", async (req, res, next) => {
    const postId = req.params.id;
    const userId = req.session.user._id;

    //try and delete retweet
    const deletedPost = await Post.findOneAndDelete({postedBy: userId, retweetData: postId}).catch((err) => {
        console.log(err);
        res.sendStatus(400);
    });

    let option = deletedPost != null ? "$pull" : "$addToSet";
    let repost = deletedPost;
    if (repost == null) {
        repost = await Post.create({postedBy: userId, retweetData: postId}).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    }

    req.session.user = await User.findByIdAndUpdate(userId, {[option]: {retweets: repost._id}}, {new: true}).catch((err) => {
        console.log(err);
        res.sendStatus(400);
    });

    const post = await Post.findByIdAndUpdate(postId, {[option]: {retweetUsers: userId}}, {new: true}).catch((err) => {
        console.log(err);
        res.sendStatus(400);
    });

    if (!deletedPost) {
        await Notification.insertNotification(post.postedBy , userId ,"retweet", post._id)
    }
    res.status(200).send(post);
});

router.delete("/:id", (req, res, next) => {
    Post.findByIdAndDelete(req.params.id)
        .then(() => res.sendStatus(202))
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

router.put("/:id", async (req, res, next) => {
    if (req.body.pinned !== undefined) {
        await Post.updateMany({postedBy: req.session.user}, {pinned: false}).catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
    }

    Post.findByIdAndUpdate(req.params.id, req.body)
        .then(() => res.sendStatus(204))
        .catch((error) => {
            console.log(error);
            res.sendStatus(400);
        });
});

async function getPosts(filter) {
    let results = await Post.find(filter)
        .populate("postedBy")
        .populate("retweetData")
        .populate("replyTo")
        .sort({createdAt: -1})
        .catch((error) => console.log(error));

    results = await User.populate(results, {path: "replyTo.postedBy"});
    return await User.populate(results, {path: "retweetData.postedBy"});
}

export default router;
