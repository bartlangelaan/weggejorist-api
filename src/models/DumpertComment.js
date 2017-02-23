import mongoose from 'mongoose';
import './DumpertVideo';

const Schema = mongoose.Schema;

const DumpertComment = new Schema({
    videoId: { type: Schema.Types.ObjectId, ref: 'DumpertVideo' },
    commentId: Number,
    kudos: Number,
    content: String,
    user: String,
    newbe: Boolean,
    published: Date,
    deleted: Boolean,
    banned: Boolean
});

module.exports = mongoose.model('DumpertComment', DumpertComment);