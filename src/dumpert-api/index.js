import bluebird from 'bluebird';
import xml2js from 'xml2js';
import request from 'request-promise';
const parseXML = bluebird.promisify(xml2js.parseString);
import xray from 'x-ray';
import debug from 'debug';

const xrayRequest = xray();
xrayRequest.timeout(10 * 1000);

const log = debug('weggejorist:dumpertAPI');

class DumpertAPI {

    /**
     * Gets the latest videos from the Dumpert RSS feed
     * @returns {Promise.<Array.<DumpertVideo>>}
     */
    getLatestVideos() {
        return request('http://www.dumpert.nl/rss.xml.php')
            .then(parseXML)
            .then(jsonResponse => {

                return jsonResponse.rss.channel[0].item.map(video => {

                    /**
                     * 1: VideoID
                     * 2: VideoSecret
                     * 3: Slug
                     * @type {RegExp}
                     */
                    const videoUrlParts = /dumpert\.nl\/mediabase\/(\d+)\/([a-z0-9]+)\/(.+).html/.exec(video.link[0]);

                    return {
                        title: video.title[0],
                        videoId: videoUrlParts[1],
                        secret: videoUrlParts[2],
                        slug: videoUrlParts[3],
                        description: video.description[0],
                        published: new Date(video.pubDate[0])
                    };

                });
            });
    }

    /**
     * Gets all comments for a Dumpert video
     * @param video DumpertVideo
     * @returns {Promise.<Array.<DumpertComment>>}
     */
    getComments({_id, videoId, secret}) {
        const url = `https://comments.dumpert.nl/embed/${videoId}/${secret}/comments/`;

        log(`Requesting ${url}`);

        const xrayPromise = new Promise((resolve, reject) => {
            xrayRequest(url, '.comment', [{
                id: '@data-commentid',
                kudos: '@data-kudos',
                content: '.cmt-content',
                user: '.username',
                date: '.datetime'
            }])((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        return xrayPromise.then(data => {
            log(`Request to ${url} done, ${data.length} comments recieved.`);

            return data.map(comment => {

                const date = {
                    year: comment.date.split(' | ')[0].split('-')[2],
                    month: comment.date.split(' | ')[0].split('-')[1],
                    day: comment.date.split(' | ')[0].split('-')[0],
                    time: comment.date.split(' | ')[1]
                };

                return {
                    videoId: _id,
                    commentId: comment.id,
                    kudos: comment.kudos,
                    content: comment.content,
                    user: comment.user,
                    published: new Date(`20${date.year}-${date.month}-${date.day} ${date.time}:00 +0100`)
                };

            });
        });
    }

}

export default new DumpertAPI();