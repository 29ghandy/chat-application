const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const postSchema = new Schema({

    title: {
        type: String,
        required: true
    }
    ,
    imageUrl: {
        type: String,
        required: true
    }
    ,
    content: {
        type: String,
        required: true
    }
    ,
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        name: String,
        required: true
    }
    ,
    createdAt: {
        type: Date,
        default: Date.now(),
        require: true
    }
}, { timeStamps: true })
module.exports = mongoose.model('Post', postSchema);