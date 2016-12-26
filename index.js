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
}

function refresh() {
    getLatest()
        .then(() => console.log('> Checked and inserterd the latest 25 video\'s'))
        .then(() => DumpertVideo.find().sort({published: -1}).select('_id videoId secret').limit(60).exec())
        .then(videos => bluebird.map(videos, video => video.refreshComments()))
        .then(() => console.log('> Checked and updated all comments of the latest 60 video\'s'))
        .then(() => setTimeout(refresh, 1000 * 60));
}


refresh();