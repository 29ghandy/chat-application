const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
    const headers = req.get('authorization');

    if (!headers) {
        const error = new Error('Not authorization');
        error.statusCode = 401;
        throw error;
    }
    const token = headers.toString().split(' ')[1];
    // console.log(token);
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'secret');
    } catch (err) {
        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    next();
}