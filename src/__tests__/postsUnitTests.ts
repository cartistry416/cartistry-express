import request from 'supertest'
import { connectDB, disconnectDB} from '../db/db.js'
import {app} from '../app.js'
import { randomBytes } from 'crypto'
import auth from '../auth/auth.js'
import { UserModel } from '../models/user-model.js'
const req = request(app)
import {Request} from 'express'
import { text } from 'stream/consumers'
import { setTimeout } from 'timers/promises'
let server;


describe('PostsController tests', () => {
    let token = null;
    let res = null;
    let userId;

    beforeAll(async () => {
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = randomBytes(32).toString('hex')
            process.env.JWT_EXPIRATION_TIME="86400"
        }
        server = app.listen(4000)
        await connectDB()
        res = await req.post('/auth/register').send({
            userName: "DummyUser123",
            email: "DummyUser123@stonybrook.edu",
            password:"PASsWord1234!",
            passwordVerify: "PASsWord1234!"
        })
        expect(res.status).toBe(200)
        res = await req.post('/auth/login').send({
            email: "DummyUser123@stonybrook.edu",
            password:"PASsWord1234!"
        })
        expect(res.status).toBe(200)
        token = res.headers['set-cookie']
        userId = res.body.user.userId
    })

    afterAll(() => {
        disconnectDB()
        server.close()
    })


    describe('Creating a post, editing it, getting most recent posts, liking posts, getting most liked posts, undo-ing a like on a post', () => {
        let postId1;
        let postId2;
        const title = 'TEST POST TITLE'
        const textContent = 'Lorem Ipsum something something'
        const tags = ['tag1', 'tag2', 'tag3']
        it ('example request to create a post', async () => {
            res = await req.post('/posts-api/posts').send({
                title,
                textContent
            }).set('Cookie', token)
            expect(res.status).toBe(200)
            postId1 = res.body.postId
            res = await req.post('/posts-api/posts').send({
                title,
                textContent,
                tags
            }).set('Cookie', token)
            expect(res.status).toBe(200)
            postId2 = res.body.postId
        })
        it ('example request to get the contents of newly created post', async () => {
            res = await req.get(`/posts-api/posts/${postId1}`)
            expect(res.status).toBe(200)
            const post = res.body.post
            expect(post.title).toBe(title)
            expect(post.textContent).toBe(textContent)
        })

        it('editing the newly created post', async () => {
            const newTitle = title + 'updated'
            const newTextContent = textContent + 'updated'
            res = await req.put(`/posts-api/posts/${postId1}`).send({title: newTitle, textContent: newTextContent}).set('Cookie', token)
            expect(res.status).toBe(200)
            const post = res.body.post
            expect(post.title).toBe(newTitle)
            expect(post.textContent).toBe(newTextContent)
        })

        it('commenting on created post', async () => {
            const comment = "HELLO I AM COMMENTING, COOL MAP!!"
            res = await req.put(`/posts-api/posts/${postId1}/comment`).send({comment}).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.comments[0].comment).toBe(comment)
        })

        it('editing comment', async () => {
            const comment = "NEVERMIND, I think your map could do better :)"
            res = await req.put(`/posts-api/posts/${postId1}/edit-comment`).send({comment, index: 0}).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.comments[0].comment).toBe(comment)
        })

        it('deleting comment', async () => {
            res = await req.delete(`/posts-api/posts/${postId1}/comment`).send({index: 0}).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.comments.length).toBe(0)
        })

        it ('example request to get most recent posts. Note that postId2 is first because it is most recent', async () => {
            res = await req.get('/posts-api/posts/most-recent/?limit=2')
            expect(res.status).toBe(200)
            const posts = res.body.posts
            expect(posts.length).toBe(2)
            expect(posts[0]._id).toBe(postId2)
            expect(posts[1]._id).toBe(postId1)
        })

        it ('example request to like a post and then obtain the most liked posts', async () => {

            res = await req.put(`/posts-api/posts/${postId2}/likes`).set('Cookie', token)
            expect(res.status).toBe(200)
            res = await req.get('/posts-api/posts/most-liked/?limit=2')
            expect(res.status).toBe(200)
            const posts = res.body.posts
            expect(posts.length).toBe(2)
            expect(posts[0]._id).toBe(postId2)
            expect(posts[1]._id).toBe(postId1)

            res = await req.put(`/posts-api/posts/${postId2}/likes`).set('Cookie', token)
            expect(res.status).toBe(200)
            res = await req.get(`/posts-api/posts/${postId2}`)
            expect(res.status).toBe(200)
            const post = res.body.post
            expect(post.likes).toBe(0)
        })

        it ('get all posts owned by the user', async () => {
            res = await req.get(`/posts-api/posts/user/${userId}`).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.posts.length).toBe(2)
        })

        it ('search for posts by title', async () => {
            res = await req.get(`/posts-api/posts/search-title`).send({title: title})
            expect(res.status).toBe(200)
            expect(res.body.posts.length).toBe(2)
        })

        it ('search for posts by tags', async () => {
            res = await req.get(`/posts-api/posts/search-tags?tags=tag1,tag2,tag3`)
            expect(res.status).toBe(200)
            expect(res.body.posts.length).toBe(1)
        })


        it('delete a post', async () => {
            res = await req.delete(`/posts-api/posts/${postId1}`).set('Cookie', token)
            expect(res.status).toBe(200)
            res = await req.get(`/posts-api/posts/user/${userId}`).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.posts.length).toBe(1)

            res = await req.get(`/posts-api/posts/most-recent/?limit=2`)
            expect(res.status).toBe(200)
            expect(res.body.posts.length).toBe(1)

            res = await req.get(`/posts-api/posts/${postId1}`)
            expect(res.status).toBe(404)
            
        })

    })

})

