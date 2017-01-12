import express from "express";
import DumpertComment from '../models/DumpertComment';

const api = express();

api.get('/comments', (req, res) => {
    const query = {};

    // /?deleted=true
    // /?deleted=false
    if(req.query.deleted !== undefined) {
        query['deleted.deleted'] = req.query.deleted ? true : false;
    }

    // /?banned=true
    // /?banned=false
    if(req.query.banned !== undefined) {
        query['deleted.banned'] = req.query.banned ? true : false
    }

    let sort = {published: -1};

    if(req.query.sort == 'deleted'){
        sort = {'deleted.detectedAt': -1};
    }

    DumpertComment.find(query).sort(sort).limit(200).exec().then(data => res.json(data))
});

export default api;