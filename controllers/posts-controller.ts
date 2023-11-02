import { UserModel, UserDocument } from '../models/user-model'; // Import the User model and UserDocument
import { PostModel, PostDocument } from '../models/post-model'; // Import the Post model and PostDocument
import { MapMetadataModel, MapMetadataDocument } from '../models/mapMetadata-model'; // Import the MapMetadata model and MapMetadataDocument
import { Types } from 'mongoose';

async function findUserById(userId: string): Promise<UserDocument | null> {
  try {
    const user = await UserModel.findById(userId)
    if (!user) {
      return null;
    }
    return user;
  } catch (err) {
    return null;
  }
}

function extractPostCardInfo(posts: PostDocument[]) {
    const extractedPosts =  posts.map(post => {
        const {title, owner, ownerUserName, thumbnail, likes, forks, tags, publishDate, mapMetadata} = post
        return {title, owner, ownerUserName, thumbnail, likes, forks, tags, publishDate, mapMetadata}
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
    const postTitleQuery = new RegExp(req.params.title, "i") // case insensitive
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

}

const getPost = async (req , res) => {

}

const getMostRecentPosts = async (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        })
    }

    const limit = body.limit

    try {
        const posts = await PostModel.aggregate([
            {$sort: {publishDate: -1}},
            {$limit: limit}
        ])
        return res.status(200).json({success: true, posts})
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: `Unable to retrieve ${limit} most recent posts`})
    }
}

const getMostLikedPosts = async (req, res) => {
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        })
    }

    const limit = body.limit

    try {
        const posts = await PostModel.aggregate([
            {$sort: {likes: -1}},
            {$limit: limit}
        ])
        return res.status(200).json({success: true, posts})
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: `Unable to retrieve ${limit} most recent posts`})
    }
}


const createPost = async (req, res) => {
    const body = req.body
    let result: any = null
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body',
        })
    }

    const user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    let title = body.name === undefined ? `Untitled ${user.untitledCount}` : body.title
    const post = new PostModel({...body, owner: req.userId, ownerUserName: user.userName, title})
    if (!post) {
        return res.status(500).json({ success: false, errorMessage: "Unable to create post" })
    }

    try {
        result = await UserModel.findByIdAndUpdate(req.userId, {$push: {posts: post._id}, $inc: {untitledCount: 1}})
        if (!result) {
            return res.status(500).json({success: false, errorMessage: "Unable to update user"})
        }
        await post.save()
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: "Unable to save post or update user"})
    }

    return res.status(200).json({success: true})
}

const editPost = async (req, res) => {

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
        const deletedPost = await PostModel.findByIdAndDelete(body.postId)
        if (!deletedPost) {
            return res.status(400).json({
                success: false,
                errorMessage: "Unable to find post"
            })
        }
        let result = await UserModel.updateMany({}, {$pull: {likedPosts: deletedPost._id}})
        if (!result) {
            return res.status(500).json({success: false, errorMessage: "Unable to remove deleted posts from all users likes"})
        }
        console.log(`Removed post from ${result.nModified} users likes`)
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
        publishDate: Date.now()
    }

   const post = await PostModel.findByIdAndUpdate(req.params.id, {$push: {comments: newComment}}, {new: true})
   if (!post) {
        return res.status(400).json({success: false, errorMessage: "Unable to find post"})
   }
   return res.status(200).json({success: true})

}


const editComment = async (req, res) => {

    
}

const updatePostLikes = async(req, res) => {

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

    const indexOfAlreadyLiked = user.likedPosts.findIndex(postId =>{
        postId.toString() === req.params.id
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