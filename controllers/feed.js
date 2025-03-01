const { validationResult } = require('express-validator');
const Post = require('../models/post');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const io = require('../socket');

exports.getPost = async (req, res, next) => {
    const id = req.params.postId;
    try {
        const post = await Post.findById(id)
        if (!post) {
            const error = new Error('no post found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Posts found', post: post });

    }
    catch (error) { console.log(error) };


};
exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1
    const perPage = 2;
    try {
        const totalCount = await Post.find().countDocuments()
        const posts = await Post.find().sort({ createdAt: -1 }).skip((currentPage - 1) * perPage).limit(perPage);

        res.status(200).json({ message: 'Fetched posts successfully.', posts: posts, totalItems: totalCount });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    try {
        await post.save();
        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();
        io.getIO().emit('posts', {
            action: 'create',
            post: { ...post._doc, creator: { _id: req.userId, name: user.name } }
        });
        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: { _id: user._id, name: user.name }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};
exports.getPost = (req, res, next) => {
    const postId = req.params.postId; // search for  id ll post

    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const err = new Error('cant find ur post');
                err.statusCode = 404;
                throw err;
            }
            res.status(200).json({ message: 'post fetched', post: post });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;

            }
            next(err);
        })
}
exports.updatePost = async (req, res, next) => {

    const errors = validationResult(req);
    //console.log(errors);
    if (!errors.isEmpty()) {
        const error = new Error("validation failed");
        error.statusCode = 422;
        throw error;
    }

    const postId = req.params.postId;
    const content = req.body.content;
    let imageURL = req.body.image;
    const title = req.body.title;

    if (req.file) imageURL = req.file.path;
    if (!imageURL) {
        const error = new Error("No image provided");
        error.statusCode = 422;
        throw error;
    }
    try {
        const post = await Post.findById(postId).populate('creator');

        if (!post) {
            const err = new Error('cant find ur post');
            err.statusCode = 404;
            throw err;
        }
        console.log(post.creator, req.userId);
        if (post.creator._id.toString() !== req.userId) {
            const err = new Error('Not autherized');
            err.statusCode = 403;
            throw err;
        }
        if (imageURL.toString() !== post.imageUrl.toString()) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageURL;
        post.content = content;
        const result = await post.save();
        io.getIO('posts', { actoin: 'update', post: post })
        res.status(200).json({ message: 'post updated', post: result });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}
exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const result = await Post.findById(postId)
        if (!result) {
            const err = new Error('cant find ur post');
            err.statusCode = 404;
            throw err;
        }
        if (result.creator.toString() !== req.userId) {
            const err = new Error('Not autherized');
            err.statusCode = 403;
            throw err;
        }
        clearImage(result.imageUrl);
        await Post.findByIdAndDelete(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        io.getIO.emit('posts', { action: 'delete', post: postId })
        res.status(200).json({ message: 'post deleted' });
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }

}
const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};
