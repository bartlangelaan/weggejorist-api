import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DumpertVideo = new Schema({
    title: String,
    videoId: String,
    description: String,
    published: Date,
    views: Number,
    lastScanned: Date,
    commentsLastScanned: Date
});

module.exports = mongoose.model('DumpertVideo', DumpertVideo);