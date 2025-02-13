const User = require('../models/user');

exports.signUp = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    const status = req.body.status;
    const posts = req.body.posts;

}