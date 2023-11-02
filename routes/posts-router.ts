/*
    This is where we'll route all of the received http requests
    into controller response functions.
    
    @author McKilla Gorilla
*/
const express = require('express')
import {PostsController} from '../controllers/posts-controller'
const router = express.Router()
const auth = require('../auth')

router.get('/posts/search-title/:title', PostsController.searchPostsByTitle)
router.get('/posts/search-tags', PostsController.searchPostsByTags)
router.get('/posts/user/:userId', PostsController.getPostsOwnedByUser)
router.get('/posts/:id', PostsController.getPost)
router.get('/posts/most-recent', PostsController.getMostRecentPosts)
router.get('/posts/most-liked', PostsController.getMostLikedPosts)

router.post('/posts', auth.verify, PostsController.createPost)

// Any non-guest user can like, dislike, or comment on another user's post (or their own)
router.put('/posts/:id', auth.verify, PostsController.editPost)
router.put('/posts/:id/likes', auth.verify, PostsController.updatePostLikes)
router.put('/posts/:id/comment', auth.verify, PostsController.commentOnPost)
router.put('/posts/:id/edit-comment', auth.verify, PostsController.editComment)

router.delete('/posts/:id', auth.verify, PostsController.deletePost)
router.delete('/posts/:id/comment', auth.verify, PostsController.deleteComment)


module.exports = router