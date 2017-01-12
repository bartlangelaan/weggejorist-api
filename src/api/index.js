import express from "express";
import DumpertComment from '../models/DumpertComment';

const api = express();

api.get('/deleted', (req, res) => {
    DumpertComment.find({'deleted.deleted': true}).sort({'deleted.detectedAt': -1}).limit(200).exec().then(data => res.json(data))
});

export default api;