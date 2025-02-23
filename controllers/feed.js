const { validationResult } = require('express-validator');
const Post = require('../models/post');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');

exports.getPost = (req, res, next) => {
    const id = req.params.postId;

    Post.findById(id).then((post) => {
        if (!post) {
            const error = new Error('no post found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Posts found', post: post });

    }).catch((error) => { console.log(error) });


};
exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1
    const perPage = 2;
    let totalCount = 0;
    Post.find()
        .countDocuments()
        .then((count) => {
            totalCount = count;
            return Post.find().skip((currentPage - 1) * perPage).limit(perPage);
        }).then(posts => {
            res.status(200).json({ message: 'Fetched posts successfully.', posts: posts, totalItems: totalCount });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    //console.log(errors);
    if (!errors.isEmpty()) {
        const error = new Error("validation failed");
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error("No file provided");
        error.statusCode = 422;
        throw error;
    }

    // console.log(req);
    const imageUrl = req.file.path.replace("\\", "/");
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId,
        createdAt: Date.now()
    });
    post.save().then(user => {
        return User.findById(req.userId);
    })
        .then((user) => {
            // console.log(user);
            user.posts.push(post);

            creator = user;
            return user.save();

        })
        .then(result => {
            res.status(201).json({
                message: 'Post created successfully!',
                post: post,
                creator: { id: creator._id, name: creator.name }
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // because this is an async code in order to excute u need to move to the next phase first
        });

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
exports.updatePost = (req, res, next) => {

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

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const err = new Error('cant find ur post');
                err.statusCode = 404;
                throw err;
            }
            console.log(post.creator, req.userId);
            if (post.creator.toString() !== req.userId) {
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
            return post.save();
        })
        .then((result) => {
            res.status(200).json({ message: 'post updated', post: result });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}
exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId).then((result) => {
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
        return Post.findByIdAndDelete(postId);

    }).then(user => {
        return User.findById(req.userId);
    })
        .then(result => {
            result.posts.pull(postId);
            return result.save()
        })
        .then(result => {

            res.status(200).json({ message: 'post deleted' });
        })
        .catch((err) => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}
const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};
