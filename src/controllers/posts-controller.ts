import { UserModel, UserDocument } from '../models/user-model.js'; // Import the User model and UserDocument
import { PostModel, PostDocument } from '../models/post-model.js'; // Import the Post model and PostDocument
import { MapMetadataModel, MapMetadataDocument } from '../models/mapMetadata-model.js'; // Import the MapMetadata model and MapMetadataDocument
import { findUserById } from '../utils/utils.js';



function extractPostCardInfo(posts: PostDocument[]) {
    const extractedPosts =  posts.map(post => {
        const {title, owner, ownerUserName, thumbnail, likes, forks, tags, mapMetadata, _id, createdAt, updatedAt} = post
        return {title, owner, ownerUserName, thumbnail, likes, forks, tags, mapMetadata, _id, createdAt, updatedAt}
    })
    return extractedPosts
}

const searchPostsByTitle = async (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        })
    }

    const limit = body.limit
    const postTitleQuery = new RegExp(body.title, "i") // case insensitive
    try {
        const posts = await PostModel.find({title: postTitleQuery})
        // if (posts.length === 0) {
        //     return res.status(404).json({success: false})
        // }
        return res.status(200).json({success: true, posts: extractPostCardInfo(posts)})
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: `Unable to retrieve posts searched by title`})
    }
}

const searchPostsByTags = async (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        })
    }

    const limit = body.limit
    const tags = body.tags
    try {
        const posts = await PostModel.find({tags: {$all: tags}})
        // if (posts.length === 0) {
        //     return res.status(404).json({success: false, errorMessage: "No posts found searched by tags"})
        // }
        return res.status(200).json({success: true, posts: extractPostCardInfo(posts)})
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: `Unable to retrieve posts searched by title`})
    }
}

const getPostsOwnedByUser = async (req, res) => {

    const user = await findUserById(req.params.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }


    try {
        const posts = await PostModel.find({ownerUserName: user.userName})
        return res.status(200).json({
            success: true,
            posts: extractPostCardInfo(posts)
        })
    }
    catch(err) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find posts owned user"
        })
    }


}

const getPost = async (req , res) => {
    const postId = req.params.id
    try {
        const post = await PostModel.findById(postId)
        if (!post) {
            return res.status(404).json({success: false, errorMessage: "post not found"})
        }
        return res.status(200).json({success: true, post})
    }
    catch (err) {
        return res.status(400).json({success: false, errorMessage: `Unable to retrieve post`})
    }
}

const getMostRecentPosts = async (req, res) => {
    const limit = Number.parseInt(req.query.limit)
    // console.log(limit)
    try {
        const posts = await PostModel.aggregate([
            {$sort: {createdAt: -1}},
            {$limit: limit}
        ])
        return res.status(200).json({success: true, posts})
    }
    catch (err) {
        console.error(err)
        return res.status(500).json({success: false, errorMessage: `Unable to retrieve ${limit} most recent posts`})
    }
}

const getMostLikedPosts = async (req, res) => {
    const limit = Number.parseInt(req.query.limit)
    //console.log(limit)
    try {
        const posts = await PostModel.aggregate([
            {$sort: {likes: -1}},
            {$limit: limit}
        ])
        return res.status(200).json({success: true, posts: extractPostCardInfo(posts)})
    }
    catch (err) {
        console.error(err)
        return res.status(500).json({success: false, errorMessage: `Unable to retrieve ${limit} most recent posts`})
    }
}


const createPost = async (req, res) => {
    const body = req.body
    let result: any = null
    if (!body || !body.title || !body.textContent) {
        return res.status(400).json({
            success: false,
            error: 'You must provide title and textContent in body',
        })
    }

    const user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    let tags = []
    if (body.tags) {
        tags = body.tags;
    }

    const post = await PostModel.create({owner: req.userId, ownerUserName: user.userName, title: body.title, textContent: body.textContent, tags})
    if (!post) {
        return res.status(500).json({ success: false, errorMessage: "Unable to create post" })
    }

    try {
        result = await UserModel.findByIdAndUpdate(req.userId, {$push: {posts: post._id}})
        if (!result) {
            return res.status(500).json({success: false, errorMessage: "Unable to update user"})
        }
        return res.status(200).json({success: true, postId: post._id})
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: "Unable to save post or update user"})
    }
}

const editPost = async (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        })
    }

    let user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    try {
        const post = await PostModel.findByIdAndUpdate(req.params.id, {title: body.title, textContent: body.textContent}, {new: true}) // TODO IMAGES
        return res.status(200).json({success: true, post})
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: "Unable to edit post"})
    }


}

const deletePost = async (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        })
    }

    let user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    try {
        const deletedPost = await PostModel.findById(req.params.id)
        if (!deletedPost) {
            return res.status(400).json({
                success: false,
                errorMessage: "Unable to find post"
            })
        }
        await deletedPost.remove()
        let result = await UserModel.updateMany({}, {$pull: {likedPosts: deletedPost._id}})
        if (!result) {
            return res.status(500).json({success: false, errorMessage: "Unable to remove deleted posts from all users likes"})
        }
        //console.log(`Removed post from ${result.nModified} users likes`)
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: "Unable to remove deleted posts from all users likes"})
    }

    return res.status(200).json({success: true})

}

const commentOnPost = async (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        })
    }

    let user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    const newComment = {
        authorUserName: user.userName,
        comment: body.comment,
        publishDate: new Date(Date.now())
    }

   const post = await PostModel.findById(req.params.id)
   if (!post) {
        return res.status(404).json({success: false, errorMessage: "Unable to find post"})
   }

   const newComments = [...post.comments, newComment]
   post.comments.push(newComment)
   post.markModified('comments')
   await post.save()
   return res.status(200).json({success: true, comments: newComments})

}


const editComment = async (req, res) => {
    const body = req.body;
    if (!body || !body.comment || body.index === undefined || !(body.index >= 0)) {
        return res.status(400).json({
            success: false,
            errorMessage: 'You must provide a body with comment and index',
        })
    }
    let user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    const post = await PostModel.findById(req.params.id)
    if (!post) {
        return res.status(404).json({success: false, errorMessage: "Unable to find post"})
    }

    const oldComment = post.comments[body.index]
    if (oldComment.authorUserName !== user.userName) {
        return res.status(401).json({success: false, errorMessage: "Unauthorized to edit this comment"})
    }
    const newComment = {
        authorUserName: user.userName,
        comment: body.comment,
        publishDate: new Date(Date.now())
    }
    post.comments[body.index] = newComment
    post.markModified('comments')
    await post.save()

    return res.status(200).json({success:true, comments: post.comments})


}

const updatePostLikes = async(req, res) => {

    let user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    const indexOfAlreadyLiked = user.likedPosts.findIndex(postId =>{
        return postId.toString() === req.params.id
    })
    
    let post: PostDocument | null = null
    if (indexOfAlreadyLiked !== -1) {
        try {
            post = await PostModel.findByIdAndUpdate(req.params.id, {$inc : {likes: -1}}, {new: true})
            if (!post) {
                return res.status(404).json({success: false, errorMessage: "Unable to undo like"})
            }
            const result = await UserModel.updateOne({_id: user._id}, {$pull: {likedPosts: post._id}}, {new: true})
            if (result.nModified === 0) {
                return res.status(500).json({success: false, errorMessage: "Unable to remove from users liked posts"})
            }

            return res.status(200).json({success: true})
        }
        catch (err) {
            return res.status(500).json({success: false, errorMessage: "Unable to remove from users liked posts"})
        }
    }

    post = await PostModel.findByIdAndUpdate(req.params.id, {$inc : {likes: 1}})
    if (!post) {
        return res.status(404).json({success: false, errorMessage: "Unable to increment like"})
    }

    try {
        const result = await UserModel.updateOne({_id: user.id}, {$push: {likedPosts: post._id}}, {new: true})
        if (result.nModified === 0) {
            return res.status(500).json({success: false, errorMessage: "Unable to add to users liked posts"})
        }
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: "Unable to add to users liked posts"})
    }
    return res.status(200).json({success: true})
}


const deleteComment = async (req, res) => {
    const body = req.body;
    if (!body || body.index === undefined || !(body.index >= 0)) {
        return res.status(400).json({
            success: false,
            errorMessage: 'You must provide a body with comment and index',
        })
    }
    let user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    const post = await PostModel.findById(req.params.id)
    if (!post) {
        return res.status(404).json({success: false, errorMessage: "Unable to find post"})
    }

    const comment = post.comments[body.index]
    if (comment.authorUserName !== user.userName) {
        return res.status(401).json({success: false, errorMessage: "Unauthorized to edit this comment"})
    }

    post.comments.splice(body.index, 1)
    post.markModified('comments')
    await post.save()

    return res.status(200).json({success:true, comments: post.comments})

}


const PostsController = {
    createPost,
    deletePost,
    commentOnPost,
    updatePostLikes,
    getMostRecentPosts,
    getMostLikedPosts,
    getPost,
    getPostsOwnedByUser,
    searchPostsByTitle,
    searchPostsByTags,
    deleteComment,
    editPost,
    editComment,
}

export {PostsController}