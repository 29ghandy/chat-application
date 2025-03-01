const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const path = require('path');
const { error } = require('console');
const app = express();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');


// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images');
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4())
    }
});
const fileFilter = (req, file, cb) => {
    const filepaths = ['image/png', 'image/jpg', 'image/jpeg'];
    // let index = filepaths.find(file.mimetype);
    if (filepaths.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(null, true);
    }
}
app.use(multer({ storage: storage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});




app.use(error, (req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.statusCode(status).json({ message: message, date: data });
})

mongoose.connect("mongodb+srv://omarmamdouh753:DDwpuXrxbAJbFyFV@cluster0.w7ylr.mongodb.net/")
    .then((res) => {
        app.listen(8080);

    })
    .catch((err) => {
        console.log(err);
    });
