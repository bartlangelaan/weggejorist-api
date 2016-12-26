const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/weggejorist');

const DumpertVideo = require('./DumpertVideo');
const request = require('request-promise');

const bluebird = require('bluebird');
const parseXML = bluebird.promisify(require('xml2js').parseString);


function getLatest() {
    return request('http://www.dumpert.nl/rss.xml.php')
        .then(parseXML)
        .then(videos => {

            return bluebird.map(videos.rss.channel[0].item, video => {

                /**
                 * 1: VideoID
                 * 2: VideoSecret
                 * 3: Slug
                 * @type {RegExp}
                 */
                const videoUrlParts = /dumpert\.nl\/mediabase\/(\d+)\/([a-z0-9]+)\/(.+).html/.exec(video.link[0]);


                return DumpertVideo.findOneAndUpdate({videoId: videoUrlParts[1]}, {
                    title: video.title[0],
                    videoId: videoUrlParts[1],
                    secret: videoUrlParts[2],
                    slug: videoUrlParts[3],
                    description: video.description[0],
                    published: new Date(video.pubDate[0])
                }, {upsert: true});

            });

        })
        .then(() => console.log('done!'));
}

function refresh() {
    getLatest()
        .then(() => DumpertVideo.find())
        .then(videos => bluebird.map(videos, video => video.refreshComments()))
        .then(() => console.log('REFRESHED!'))
        .then(() => setTimeout(refresh, 1000 * 60));
}


refresh();