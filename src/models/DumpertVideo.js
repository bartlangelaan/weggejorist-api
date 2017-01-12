const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DumpertVideo = new Schema({
    title: String,
    videoId: Number,
    secret: String,
    slug: String,
    description: String,
    published: Date
});

module.exports = mongoose.model('DumpertVideo', DumpertVideo);