import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DumpertPage = new Schema({
    number: Number,
    lastScanned: Date,
    results: Number
});

export default mongoose.model('DumpertPage', DumpertPage);