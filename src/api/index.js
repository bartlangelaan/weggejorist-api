import express from 'express';
import DumpertComment from '../models/DumpertComment';
import cors from 'cors';

const api = express();

api.use(cors());

api.get('/comments', (req, res) => {
    const query = {};

    // /?banned=true
    // /?banned=false
    if (req.query.banned !== undefined) {
        query['banned'] = req.query.banned != 'false' ? true : false;
    }

    // /?before=8282383
    if (req.query.before) {
        query['commentId'] = {$lt: req.query.before};
    }

    // /?after=8282383
    if (req.query.after) {
        query['commentId'] = {$gt: req.query.after};
    }

    // /?sort=deleted
    let sort = {commentId: -1};
    // if (req.query.sort == 'deleted') {
    //     sort = {'deleted.detectedAt': -1};
    // }

    DumpertComment.find(query).sort(sort).limit(200).populate('videoId', 'title').exec().then(data => res.json(data));
});

export default api;