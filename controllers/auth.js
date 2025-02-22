const User = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;

    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    bcrypt.hash(password, 12).then(hashedPassword => {
        const user = new User({
            email: email,
            password: hashedPassword,
            name: name

        })
        return user.save();
    }).then(result => {
        console.log(result);
        res.status(201).json({ message: 'User created!', userId: result._id });
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });

}

exports.login = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    let loadedAccount = null;
    User.findOne({ email: email })
        .then(result => {
            if (!result) {
                const error = new Error('Can not find the email');
                error.statusCode = 401;
                throw error;
            }
            loadedAccount = result;
            return bcrypt.compare(password, result.password);
        }).then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: email,
                userId: loadedAccount._id
            }, 'secret', { expiresIn: '1h' });

            res.status(200).json({ token: token, userId: loadedAccount._id.toString() })


        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);

        })
}

exports.getStatus = (req, res, next) => {

    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('Can not find the email');
                error.statusCode = 401;
                throw error;
            }
            res.status(200).json({ status: user.status });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}
exports.updateStatus = (req, res, next) => {

    User.findById(req.userId)
        .then(user => {
            if (!user) {
                const error = new Error('Can not find the email');
                error.statusCode = 401;
                throw error;
            }
            user.status = req.body.status;
            return user.save();
        })
        .then(result => {
            res.status(200).json({ message: 'updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })

}