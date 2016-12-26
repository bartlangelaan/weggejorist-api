const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DumpertComment = new Schema({
    videoId: { type: Schema.Types.ObjectId, ref: 'DumpertVideo' },
    commentId: Number,
    kudos: Number,
    content: String,
    user: String,
    published: Date,
    deleted: {
        deleted: Boolean,
        banned: Boolean,
        detectedAt: Date,
        originalContent: String
    }
});

module.exports = mongoose.model('DumpertComment', DumpertComment);