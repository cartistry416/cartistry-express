/*
    This is where we'll route all of the received http requests
    into controller response functions.
    
    @author McKilla Gorilla
*/
// const express = require('express')
import express from 'express'
import {PostsController} from '../controllers/posts-controller.js'
const postsRouter = express.Router()
// const auth = require('../auth')
import auth from '../auth/auth.js'


postsRouter.get('/posts/search-title/:title', PostsController.searchPostsByTitle)
postsRouter.get('/posts/search-tags', PostsController.searchPostsByTags)
postsRouter.get('/posts/user/:userId', PostsController.getPostsOwnedByUser)
postsRouter.get('/posts/:id', PostsController.getPost)
postsRouter.get('/posts/most-recent', PostsController.getMostRecentPosts)
postsRouter.get('/posts/most-liked', PostsController.getMostLikedPosts)

postsRouter.post('/posts', auth.verify, PostsController.createPost)

// Any non-guest user can like, dislike, or comment on another user's post (or their own)
postsRouter.put('/posts/:id', auth.verify, PostsController.editPost)
postsRouter.put('/posts/:id/likes', auth.verify, PostsController.updatePostLikes)
postsRouter.put('/posts/:id/comment', auth.verify, PostsController.commentOnPost)
postsRouter.put('/posts/:id/edit-comment', auth.verify, PostsController.editComment)

postsRouter.delete('/posts/:id', auth.verify, PostsController.deletePost)
postsRouter.delete('/posts/:id/comment', auth.verify, PostsController.deleteComment)

export {postsRouter}
// module.exports = postsRouter
// const postspostsRouter = postsRouter
// export {postspostsRouter}