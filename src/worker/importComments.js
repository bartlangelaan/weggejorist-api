import DumpertComment from '../models/DumpertComment';
import DumpertVideo from '../models/DumpertVideo';
import { getComments } from 'dumpert-api';

export default async function (dumpertVideo) {
    try {
        const result = await getComments(dumpertVideo.videoId);

        // Get errors
        if(result.status == 'error') {
            /**
             * Intercept some known messages, like
             * 6746251_5d2f7cbe: CRC check failed
             */
            if(result.message == 'Article not found' || result.message == 'CRC check failed') {
                result.data = {comments: []};
            }
            else {
                throw Error(result.message);
            }
        }

        if(!result.data || !result.data.comments) {
            console.log(result);
            throw Error('No comments.');
        }

        let comments = result.data.comments;
        comments.forEach(comment => comments.push(...comment.child_comments));
        let numComments = comments.length;

        comments = comments.filter(comment => (!comment.approved || comment.content == '-weggejorist-' || comment.content == '-weggejorist en opgerot-'));

        console.log(`Recieved ${numComments} comments for video ${dumpertVideo.videoId} of which ${comments.length} are deleted.`);

        // Insert all comments into DB
        await Promise.all(comments.map(({approved, author_is_newbie, author_username, banned, display_content, content, creation_datetime, id, kudos_count}) =>
            DumpertComment.findOneAndUpdate(
                {commentId: id},
                {
                    videoId: dumpertVideo._id,
                    commentId: id,
                    kudos: kudos_count,
                    content,
                    user: author_username,
                    newbie: author_is_newbie,
                    published: creation_datetime,
                    deleted: !approved,
                    banned: banned || display_content == '-weggejorist en opgerot-',
                },
                {upsert:true}
            )
        ));

        dumpertVideo.commentsLastScanned = new Date();
        dumpertVideo.comments = numComments;
        if(typeof dumpertVideo.save == 'function') {
            await dumpertVideo.save();
        }
        else {
            await DumpertVideo.findOneAndUpdate({_id: dumpertVideo._id}, dumpertVideo).exec();
        }
    }
    catch(e) {
        console.log('Error while importing comments from video', dumpertVideo);
        console.log(e);
    }
}