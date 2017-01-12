import bluebird from 'bluebird';

import DumpertAPI from './dumpert-api';
import DumpertVideo from './models/DumpertVideo';
import DumpertComment from './models/DumpertComment';
import debug from 'debug';

const log = debug('weggejorist:cron');

export default class Cron {


    static start() {
        new Cron();
    }


    constructor() {

        const refreshVideos = () => {
            this.refreshVideos().then(() => {
                setTimeout(() => refreshVideos(), 1 * 60 * 1000);
            });
        };

        const refreshComments = () => {
            this.refreshComments().then(() => {
                setTimeout(() => refreshComments(), 1 * 60 * 1000);
            });
        };

        this.refreshVideos();
        this.refreshComments();

    }


    refreshVideos() {
        log('Getting latest videos from Dumpert..');
        return DumpertAPI.getLatestVideos()
            .then(videos => {
                log(`Inserting ${videos.length} videos into database..`);
                return videos;
            })
            .then(this.insertVideos)
            .then(() => log('Inserted all videos into database.'))
            .catch(err => {
                log('Cant import latest videos into database.');
                console.error(err);
            });
    }

    refreshComments() {
        log('Getting 60 latest videos from database..');
        return DumpertVideo.find().sort({published: -1}).select('_id videoId secret').limit(60).exec()
            .then(videos => {
                log(`Getting comments from ${videos.length} videos`);
                return videos;
            })
            .then(videos => bluebird.map(videos, video => {
                return DumpertAPI.getComments(video).then(comments => {
                    return bluebird.map(comments, comment => this.insertComment(comment));
                });
            }))
            .then(() => log('Inserted all comments into database.'))
            .catch(err => {
                log('Cant import comments into database.');
                console.error(err);
            });

    }

    insertVideos(videos) {
        return bluebird.map(videos, video => {
            return DumpertVideo.findOneAndUpdate({videoId: video.videoId}, video, {upsert: true});
        });
    }

    insertComment(comment) {

        const query = {videoId: comment.videoId, commentId: comment.commentId};

        return DumpertComment.findOneAndUpdate(query, comment, {upsert: true})
            .exec()
            .then(doc => {

                // If  already marked as deleted, don't do anything
                if (doc && doc.deleted.deleted) return;

                // Check the status of deletion
                let status = 0;
                if (comment.content == '-weggejorist en opgerot-') {
                    status = 2;
                }
                else if (comment.content == '-weggejorist-') {
                    status = 1;
                }

                // If not deleted, don't do anything
                if (status == 0) return;

                // If deleted, update comment in DB with original content
                return DumpertComment.findOneAndUpdate(query, {
                    deleted: {
                        deleted: true,
                        banned: status == 2,
                        detectedAt: new Date(),
                        originalContent: doc ? doc.content : null
                    }
                }).exec();


            });
    }
}