const mongoose = require('mongoose')
const schema = mongoose.Schema

const UserSchema = new schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
    ,
    posts: [{
        type: schema.Types.ObjectId,
        ref: 'Post'
    }]
})
module.exports = mongoose.model('User', UserSchema);