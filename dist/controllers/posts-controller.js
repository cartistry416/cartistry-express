var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { UserModel } from '../models/user-model.js'; // Import the User model and UserDocument
import { PostModel } from '../models/post-model.js'; // Import the Post model and PostDocument
import { MapMetadataModel } from '../models/mapMetadata-model.js'; // Import the MapMetadata model and MapMetadataDocument
import { findUserById } from '../utils/utils.js';
function extractPostCardInfo(posts) {
    const extractedPosts = posts.map(post => {
        const { title, owner, ownerUserName, thumbnail, likes, forks, tags, mapMetadata, _id, createdAt, updatedAt } = post;
        return { title, owner, ownerUserName, thumbnail, likes, forks, tags, mapMetadata, _id, createdAt, updatedAt };
    });
    return extractedPosts;
}
const searchPostsByTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null;
    const postTitleQuery = new RegExp(req.query.title, "i"); // case insensitive
    try {
        const posts = yield PostModel.find({ title: postTitleQuery }).limit(limit);
        // if (posts.length === 0) {
        //     return res.status(404).json({success: false})
        // }
        return res.status(200).json({ success: true, posts: extractPostCardInfo(posts) });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: `Unable to retrieve posts searched by title` });
    }
});
const searchPostsByTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null;
    const tags = req.query.tags ? req.query.tags.split(',') : [""];
    try {
        const posts = yield PostModel.find({ tags: { $all: tags } }).limit(limit);
        // if (posts.length === 0) {
        //     return res.status(404).json({success: false, errorMessage: "No posts found searched by tags"})
        // }
        return res.status(200).json({ success: true, posts: extractPostCardInfo(posts) });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: `Unable to retrieve posts searched by title` });
    }
});
const getPostsOwnedByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null;
    const user = yield findUserById(req.params.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }
    try {
        const posts = yield PostModel.find({ ownerUserName: user.userName }).limit(limit);
        return res.status(200).json({
            success: true,
            posts: extractPostCardInfo(posts)
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find posts owned user"
        });
    }
});
const getPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postId = req.params.id;
    try {
        const post = yield PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, errorMessage: "post not found" });
        }
        return res.status(200).json({ success: true, post });
    }
    catch (err) {
        return res.status(400).json({ success: false, errorMessage: `Unable to retrieve post` });
    }
});
const getMostRecentPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null;
    try {
        const posts = yield PostModel.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: limit }
        ]);
        return res.status(200).json({ success: true, posts });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, errorMessage: `Unable to retrieve ${limit} most recent posts` });
    }
});
const getLeastRecentPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null;
    try {
        const posts = yield PostModel.aggregate([
            { $sort: { createdAt: 1 } },
            { $limit: limit }
        ]);
        return res.status(200).json({ success: true, posts });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, errorMessage: `Unable to retrieve ${limit} least recent posts` });
    }
});
const getMostLikedPosts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null;
    try {
        const posts = yield PostModel.aggregate([
            { $sort: { likes: -1 } },
            { $limit: limit }
        ]);
        return res.status(200).json({ success: true, posts: extractPostCardInfo(posts) });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, errorMessage: `Unable to retrieve ${limit} most recent posts` });
    }
});
const createPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body || !body.title || !body.textContent) {
        return res.status(400).json({
            success: false,
            errorMessage: 'You must provide title and textContent in body',
        });
    }
    let tags = [];
    if (body.tags) {
        tags = body.tags.split(',').map(tag => tag.trim());
        // console.log(tags)
    }
    let result = null;
    let files = req.files ? req.files : [];
    let fileExtensions = body.fileExtensions ? body.fileExtensions.split(',') : [];
    let images = [];
    if (files.length > 0) {
        if (!body.fileExtensions || fileExtensions.length !== files.length) {
            return res.status(400).json({
                success: false,
                errorMssage: 'You must provide fileExtensions with length equal to number of files uploaded',
            });
        }
        images = files.map((file, index) => { return { imageData: file.buffer, contentType: body.fileExtensions[index] }; });
    }
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }
    let post;
    try {
        if (body.mapMetadataId && body.mapMetadataId !== "") {
            const mapMetadataDocument = yield MapMetadataModel.findById(body.mapMetadataId);
            if (mapMetadataDocument.owner.toString() !== req.userId) {
                return res.status(401).json({ success: false, errorMessage: "Unauthorized to publish this map" });
            }
            mapMetadataDocument.isPrivated = false;
            yield mapMetadataDocument.save();
            post = yield PostModel.create({ owner: req.userId, ownerUserName: user.userName, title: body.title, textContent: body.textContent, tags, images, mapMetadata: mapMetadataDocument._id });
        }
        else {
            post = yield PostModel.create({ owner: req.userId, ownerUserName: user.userName, title: body.title, textContent: body.textContent, tags, images });
        }
        if (!post) {
            return res.status(500).json({ success: false, errorMessage: "Unable to create post" });
        }
        result = yield UserModel.findByIdAndUpdate(req.userId, { $push: { posts: post._id } });
        if (!result) {
            return res.status(500).json({ success: false, errorMessage: "Unable to update user" });
        }
        return res.status(200).json({ success: true, postId: post._id });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, errorMessage: "Unable to save post or update user" });
    }
});
const editPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        });
    }
    let user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }
    try {
        const post = yield PostModel.findByIdAndUpdate(req.params.id, { title: body.title, textContent: body.textContent }, { new: true }); // TODO IMAGES
        return res.status(200).json({ success: true, post });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to edit post" });
    }
});
const deletePost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        });
    }
    let user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }
    try {
        const deletedPost = yield PostModel.findById(req.params.id);
        if (!deletedPost) {
            return res.status(400).json({
                success: false,
                errorMessage: "Unable to find post"
            });
        }
        yield deletedPost.remove();
        let result = yield UserModel.updateMany({}, { $pull: { likedPosts: deletedPost._id } });
        if (!result) {
            return res.status(500).json({ success: false, errorMessage: "Unable to remove deleted posts from all users likes" });
        }
        //console.log(`Removed post from ${result.nModified} users likes`)
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to remove deleted posts from all users likes" });
    }
    return res.status(200).json({ success: true });
});
const commentOnPost = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body || !body.comment) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body with a comment',
        });
    }
    let user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }
    const newComment = {
        authorUserName: user.userName,
        comment: body.comment
    };
    const post = yield PostModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find post" });
    }
    const newComments = [...post.comments, newComment];
    post.comments.push(newComment);
    post.markModified('comments');
    yield post.save();
    return res.status(200).json({ success: true, comments: newComments, index: post.comments.length - 1, comment: newComment });
});
const editComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body || !body.comment || body.index === undefined || !(body.index >= 0)) {
        return res.status(400).json({
            success: false,
            errorMessage: 'You must provide a body with comment and index',
        });
    }
    let user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }
    const post = yield PostModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find post" });
    }
    const oldComment = post.comments[body.index];
    if (oldComment.authorUserName !== user.userName) {
        return res.status(401).json({ success: false, errorMessage: "Unauthorized to edit this comment" });
    }
    const newComment = {
        authorUserName: user.userName,
        comment: body.comment,
        publishDate: new Date(Date.now())
    };
    post.comments[body.index] = newComment;
    post.markModified('comments');
    yield post.save();
    return res.status(200).json({ success: true, comments: post.comments });
});
const updatePostLikes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }
    const indexOfAlreadyLiked = user.likedPosts.findIndex(postId => {
        return postId.toString() === req.params.id;
    });
    let post = null;
    if (indexOfAlreadyLiked !== -1) {
        try {
            post = yield PostModel.findByIdAndUpdate(req.params.id, { $inc: { likes: -1 } }, { new: true });
            if (!post) {
                return res.status(404).json({ success: false, errorMessage: "Unable to undo like" });
            }
            const result = yield UserModel.updateOne({ _id: user._id }, { $pull: { likedPosts: post._id } }, { new: true });
            if (result.nModified === 0) {
                return res.status(500).json({ success: false, errorMessage: "Unable to remove from users liked posts" });
            }
            return res.status(200).json({ success: true, alreadyLiked: false, likes: post.likes });
        }
        catch (err) {
            return res.status(500).json({ success: false, errorMessage: "Unable to remove from users liked posts" });
        }
    }
    post = yield PostModel.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
    if (!post) {
        return res.status(404).json({ success: false, errorMessage: "Unable to increment like" });
    }
    try {
        const result = yield UserModel.updateOne({ _id: user.id }, { $push: { likedPosts: post._id } }, { new: true });
        if (result.nModified === 0) {
            return res.status(500).json({ success: false, errorMessage: "Unable to add to users liked posts" });
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to add to users liked posts" });
    }
    return res.status(200).json({ success: true, alreadyLiked: true, likes: post.likes });
});
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body || body.index === undefined || !(body.index >= 0)) {
        return res.status(400).json({
            success: false,
            errorMessage: 'You must provide a body with comment and index',
        });
    }
    let user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }
    const post = yield PostModel.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find post" });
    }
    const comment = post.comments[body.index];
    if (comment.authorUserName !== user.userName) {
        return res.status(401).json({ success: false, errorMessage: "Unauthorized to edit this comment" });
    }
    post.comments.splice(body.index, 1);
    post.markModified('comments');
    yield post.save();
    return res.status(200).json({ success: true, comments: post.comments });
});
const PostsController = {
    createPost,
    deletePost,
    commentOnPost,
    updatePostLikes,
    getMostRecentPosts,
    getLeastRecentPosts,
    getMostLikedPosts,
    getPost,
    getPostsOwnedByUser,
    searchPostsByTitle,
    searchPostsByTags,
    deleteComment,
    editPost,
    editComment,
};
export { PostsController };
