/*eslint no-constant-condition: "off", no-console: "off"*/

import mongoose from 'mongoose';
import { getLatest, getComments } from 'dumpert-api';
import DumpertVideo from './models/DumpertVideo';
import DumpertPage from './models/DumpertPage';
import DumpertComment from './models/DumpertComment';

// Set up mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/weggejorist');
mongoose.Promise = Promise;

async function getAllVideos(maxPage = 99999999){
    let latestReactionItems = 15;
    let page = 0;
    while(latestReactionItems == 15 && page < maxPage) {
        try {

            const result = await getLatest(page);

            // Get errors
            if(result.errors) {
                if(result.errors.includes('Out of items!')) latestReactionItems = 0;
                throw Error(result.errors.join(' - '));
            }

            console.log(`Recieved ${result.items.length} items from page ${page}.`);

            // Insert all videos into DB
            await Promise.all(result.items.map(({id, title, description, date, stats}) =>
                DumpertVideo.findOneAndUpdate(
                    {videoId: id},
                    {videoId: id, title, description, published: date, views: stats.views_total, lastScanned: new Date()},
                    {upsert:true}
                )
            ));

            await DumpertPage.findOneAndUpdate({number: page}, {number: page, lastScanned: new Date(), results: result.items.length}, {upsert:true});

        }
        catch (e) {
            console.log(`Error inserting videos from page ${page}`);
            console.log(e);
        }
        page++;
    }
}

async function getCommentsForAllVideos(maxVideos) {
    if(!maxVideos) maxVideos = await DumpertVideo.count();
    let video = 0;
    while(video < maxVideos) {
        try {

            const dumpertVideo = await DumpertVideo.findOne().sort('-published').select('_id videoId').skip(video).exec();

            const result = await getComments(dumpertVideo.videoId);

            // Get errors
            if(result.errors) {
                throw Error(result.errors.join(' - '));
            }

            if(!result.data || !result.data.comments) {
                throw Error('No comments.');
            }

            let comments = result.data.comments;
            comments.forEach(comment => comments.push(...comment.child_comments));
            let numComments = comments.length;

            comments = comments.filter(comment => !comment.approved);

            console.log(`[${video} / ${maxVideos}] Recieved ${numComments} comments for video ${dumpertVideo.videoId} of which ${comments.length} are deleted.`);

            // Insert all comments into DB
            await Promise.all(comments.map(({approved, author_is_newbe, author_username, banned, content, creation_datetime, id, kudos_count}) =>
                DumpertComment.findOneAndUpdate(
                    {commentId: id},
                    {
                        videoId: dumpertVideo._id,
                        commentId: id,
                        kudos: kudos_count,
                        content,
                        user: author_username,
                        newbe: author_is_newbe,
                        published: creation_datetime,
                        deleted: !approved,
                        banned
                    },
                    {upsert:true}
                )
            ));

            dumpertVideo.commentsLastScanned = new Date();
            dumpertVideo.comments = numComments;
            await dumpertVideo.save();
        }
        catch (e) {
            console.log(`Error inserting comments for video ${video}.`);
            console.log(e);
        }
        video++;
    }
}

(async function() {
    while(true) {
        await getAllVideos();
        await new Promise(r => setTimeout(r, 60 * 60 * 1000));
    }
})();

(async function() {
    while(true) {
        await new Promise(r => setTimeout(r, 60 * 1000));
        await getAllVideos(1);
    }
})();

(async function() {
    while(true) {
        await getCommentsForAllVideos();
        await new Promise(r => setTimeout(r, 60 * 60 * 1000));
    }
})();
(async function() {
    while(true) {
        await new Promise(r => setTimeout(r, 5 * 60 * 1000));
        await getCommentsForAllVideos(100);
    }
})();