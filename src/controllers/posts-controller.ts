import { UserModel, UserDocument } from '../models/user-model.js'; // Import the User model and UserDocument
import { PostModel, PostDocument } from '../models/post-model.js'; // Import the Post model and PostDocument
import { MapMetadataModel, MapMetadataDocument } from '../models/mapMetadata-model.js'; // Import the MapMetadata model and MapMetadataDocument
import { findUserById } from '../utils/utils.js';
import sharp from 'sharp';
import { CommentModel } from '../models/comment-model.js';



function extractPostCardInfo(posts: PostDocument[]) {
    const extractedPosts =  posts.map(post => {
        const {title, owner, ownerUserName, thumbnail, likes, forks, tags, mapMetadata, _id, createdAt, updatedAt} = post
        const numComments = post.commentList ? post.commentList.length : 0
        return {title, owner, ownerUserName, thumbnail, likes, forks, tags, mapMetadata, _id, createdAt, updatedAt, numComments}
    })
    return extractedPosts
}

const searchPostsByTitle = async (req, res) => {

    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null
    const postTitleQuery = new RegExp(req.query.title, "i") // case insensitive
    try {
        const posts = await PostModel.find({title: postTitleQuery}).limit(limit)
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
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null
    const tags = req.query.tags ? req.query.tags.split(',') : [""]
    try {
        const posts = await PostModel.find({tags: {$all: tags}}).limit(limit)
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

    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null

    const user = await findUserById(req.params.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }


    try {
        const posts = await PostModel.find({ownerUserName: user.userName}).limit(limit)
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

const getPost = async (req, res) => {
  const postId = req.params.id;
  try {
      const post = await PostModel.findById(postId);
      if (!post) {
          return res.status(404).json({ success: false, errorMessage: "Post not found" });
      }

      const comments = await Promise.all(
          post.commentList.map(commentId => CommentModel.findById(commentId))
      );

      const postWithComments = {
          ...post.toObject(),
          comments: comments
      };

      return res.status(200).json({ success: true, post: postWithComments });
  }
  catch (err) {
      return res.status(400).json({ success: false, errorMessage: "Unable to retrieve post" });
  }
}

const getMostRecentPosts = async (req, res) => {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null
    try {
        const posts = await PostModel.aggregate([
            {$sort: {createdAt: -1}},
            {$limit: limit}
        ])
        return res.status(200).json({success: true, posts: extractPostCardInfo(posts)})
    }
    catch (err) {
        console.error(err)
        return res.status(500).json({success: false, errorMessage: `Unable to retrieve ${limit} most recent posts`})
    }
}

const getLeastRecentPosts = async (req, res) => {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null
    try {
        const posts = await PostModel.aggregate([
            {$sort: {createdAt: 1}},
            {$limit: limit}
        ])
        return res.status(200).json({success: true, posts: extractPostCardInfo(posts)})
    }
    catch (err) {
        console.error(err)
        return res.status(500).json({success: false, errorMessage: `Unable to retrieve ${limit} least recent posts`})
    }
}

const getMostLikedPosts = async (req, res) => {
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : null
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
    if (!body || !body.title || !body.textContent) {
        return res.status(400).json({
            success: false,
            errorMessage: 'You must provide title and textContent in body',
        })
    }
    let tags = []
    if (body.tags) {
        tags = body.tags.split(',').map(tag => tag.trim())
    }

    let result: any = null

    let files = req.files ? req.files : []
    let images = []

    if (files.length > 0) {
        images = files.map((file, index) => { return {imageData: file.buffer, contentType: file.mimetype} } )
    }

    let thumbnail = null;
    if (images.length > 0) {
        const resizedBuffer = await sharp(images[0].imageData)
        .resize(200, 200) 
        .toBuffer()

        thumbnail = {imageData: resizedBuffer, contentType: images[0].contentType}
    }

    const user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        })
    }

    let post;
    try {
        if (body.mapMetadataId && body.mapMetadataId !== "") {
            // comment for commit
            const mapMetadataDocument = await MapMetadataModel.findById(body.mapMetadataId)
            if (mapMetadataDocument.owner.toString() !== req.userId) {
                return res.status(401).json({success: false, errorMessage: "Unauthorized to publish this map"})
            }
            mapMetadataDocument.isPrivated = false
            await mapMetadataDocument.save()
            post = await PostModel.create({owner: req.userId, thumbnail, ownerUserName: user.userName, title: body.title, textContent: body.textContent, tags, images, mapMetadata: mapMetadataDocument._id})
        }
        else {
            post = await PostModel.create({owner: req.userId, thumbnail, ownerUserName: user.userName, title: body.title, textContent: body.textContent, tags, images})
        }


        if (!post) {
            return res.status(500).json({ success: false, errorMessage: "Unable to create post" })
        }


        result = await UserModel.findByIdAndUpdate(req.userId, {$push: {posts: post._id}})
        if (!result) {
            return res.status(500).json({success: false, errorMessage: "Unable to update user"})
        }
        return res.status(200).json({success: true, postId: post._id, mapMetadataId: post.mapMetadata})
    }
    catch (err) {
        console.error(err)
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

          return res.status(200).json({success: true, alreadyLiked: false, likes: post.likes})
      }
      catch (err) {
          return res.status(500).json({success: false, errorMessage: "Unable to remove from users liked posts"})
      }
  }

  post = await PostModel.findByIdAndUpdate(req.params.id, {$inc : {likes: 1}},  {new: true})
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

  return res.status(200).json({success: true, alreadyLiked: true, likes: post.likes})
}

const commentOnPost = async (req, res) => {
    const body = req.body;
    if (!body || !body.textContent) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body with textContent',
        });
    }

    let user = await findUserById(req.userId);
    if (!user) {
        return res.status(500).json({
            success: false,
            errorMessage: "Unable to find user"
        });
    }

    try {
        const comment = await CommentModel.create({
            ownerUserName: user.userName,
            textContent: body.textContent
        });

        await comment.save();

        const post = await PostModel.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, errorMessage: "Unable to find post" });
        }

        post.commentList.push(comment._id);
        await post.save();

        return res.status(200).json({ success: true, comment: comment, index: post.commentList.length - 1 });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, errorMessage: 'Error adding comment' });
    }
}

const editComment = async (req, res) => {
  const body = req.body;
  if (!body || !body.textContent || !body.index) {
      return res.status(400).json({
          success: false,
          errorMessage: 'You must provide a body with textContent and index',
      });
  }

  let user = await findUserById(req.userId);
  if (!user) {
      return res.status(500).json({
          success: false,
          errorMessage: "Unable to find user"
      });
  }

  const post = await PostModel.findById(req.params.id);
  const commentId = post.commentList[body.index]
  if (!post) {
      return res.status(404).json({ success: false, errorMessage: "Unable to find post" });
  }

  if (!post.commentList.includes(commentId)) {
      return res.status(404).json({ success: false, errorMessage: "Comment not found in the post" });
  }

  try {
      const comment = await CommentModel.findById(commentId);
      if (!comment) {
          return res.status(404).json({ success: false, errorMessage: "Unable to find comment" });
      }

      if (comment.ownerUserName !== user.userName) {
          return res.status(401).json({ success: false, errorMessage: "Unauthorized to edit this comment" });
      }

      comment.textContent = body.textContent;
      await comment.save();
      return res.status(200).json({ success: true, message: "Comment updated" });
  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ success: false, errorMessage: 'Error updating comment' });
  }
}

const deleteComment = async (req, res) => {
  const { index } = req.body;
  if (!index) {
      return res.status(400).json({
          success: false,
          errorMessage: 'You must provide an index',
      });
  }

  let user = await findUserById(req.userId);
  if (!user) {
      return res.status(500).json({
          success: false,
          errorMessage: "Unable to find user"
      });
  }

  const post = await PostModel.findById(req.params.id);
  const commentId = post.commentList[index]
  if (!post) {
      return res.status(404).json({ success: false, errorMessage: "Unable to find post" });
  }

  try {
      const comment = await CommentModel.findById(commentId);
      if (!comment) {
          return res.status(404).json({ success: false, errorMessage: "Unable to find comment" });
      }

      if (comment.ownerUserName !== user.userName) {
          return res.status(401).json({ success: false, errorMessage: "Unauthorized to delete this comment" });
      }

      await CommentModel.findByIdAndDelete(commentId);

      post.commentList.splice(index, 1)
      post.markModified('comments')
      await post.save()

      return res.status(200).json({ success: true, message: "Comment deleted" });

  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ success: false, errorMessage: 'Error deleting comment' });
  }
}


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
}

export {PostsController}