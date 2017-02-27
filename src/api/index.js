import express from 'express';
import DumpertComment from '../models/DumpertComment';
import DumpertVideo from '../models/DumpertVideo';
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

api.get('/stats', async (req, res) => {

    const allVideos = await DumpertVideo.aggregate([
        {
            $group: {
                _id: null,
                views: { $sum: '$views'  },
                comments: { $sum: '$comments'}
            }
        }
    ]);

    const videosPerMonth = await DumpertVideo.aggregate([
        {
            $group: {
                _id: {year: {$year: '$published'}, month: {$month: '$published'}},
                views: {$sum: '$views'},
                comments: {$sum: '$comments'}
            },
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1,
            }
        }
    ]);

    const commentsPerMonth = await DumpertComment.aggregate([
        {
            $group: {
                _id: {year: {$year: '$published'}, month: {$month: '$published'}},
                deleted: { $sum: 1 },
                deleted_newbie: { $sum: {$cond : [ "$newbie", 1, 0 ] } },
                deleted_banned: { $sum: {$cond : [ "$banned", 1, 0 ] } }
            },
        },
        {
            $sort: {
                '_id.year': 1,
                '_id.month': 1,
            }
        }
    ]);

    res.json({
        stats: {
            items: {
                count: await DumpertVideo.count({}),
                uploaded: parseInt((await DumpertVideo.aggregate([
                    {$sort: {published: -1}},
                    {$limit: 100},
                    {$sort: {videoId: -1}},
                    {$limit: 1}
                ]).exec())[0].videoId.split('_')[0]),
                views: allVideos[0].views,
                per_month: videosPerMonth
            },
            comments: {
                count: allVideos[0].comments,
                count_since_newbies: await DumpertComment.count({published: {$gte: new Date('2016-10-29T15:14:17Z')}}),
                deleted: {
                    count: await DumpertComment.count({}),
                    newbie: await DumpertComment.count({newbie: true}),
                    banned: await DumpertComment.count({banned: true}),
                    newbieAndBanned: await DumpertComment.count({newbie: true, banned: true})
                },
                per_month: commentsPerMonth,
            },
            worker: {
                comments: {
                    scannedVideos: await DumpertVideo.count({commentsLastScanned: {$exists: true}})
                }
            }
        }
    });

});

export default api;