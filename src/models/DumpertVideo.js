import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DumpertVideo = new Schema({
    title: String,
    videoId: String,
    description: String,
    published: Date,
    views: Number,
    comments: Number,
    lastScanned: Date,
    commentsLastScanned: Date
});

export default mongoose.model('DumpertVideo', DumpertVideo);