import mongoose from 'mongoose';
import './DumpertVideo';

const Schema = mongoose.Schema;

const DumpertComment = new Schema({
    videoId: { type: Schema.Types.ObjectId, ref: 'DumpertVideo' },
    commentId: Number,
    kudos: Number,
    content: String,
    user: String,
    newbie: Boolean,
    published: Date,
    deleted: Boolean,
    banned: Boolean
});

export default mongoose.model('DumpertComment', DumpertComment);