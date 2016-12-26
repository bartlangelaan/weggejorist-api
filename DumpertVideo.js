const mongoose = require('mongoose');
const request = require('request-promise');
const bluebird = require('bluebird');
const xray = require('x-ray')();
const Schema = mongoose.Schema;
const DumpertComment = require('./DumpertComment');

const DumpertVideo = new Schema({
    title: String,
    videoId: Number,
    secret: String,
    slug: String,
    description: String,
    published: Date
});

DumpertVideo.methods.refreshComments = function() {

    const url = `https://comments.dumpert.nl/embed/${this.videoId}/${this.secret}/comments/`;

    const xrayPromise = new Promise((resolve, reject) => {
        xray(url, '.comment', [{
            id: '@data-commentid',
            kudos: '@data-kudos',
            content: '.cmt-content',
            user: '.username',
            date: '.datetime'
        }])((err, data) => {
            if(err) reject(err);
            else resolve(data);
    })});

    return xrayPromise.then(data => {

        return bluebird.map(data, comment => {

            const date = {
                year: comment.date.split(' | ')[0].split('-')[2],
                month: comment.date.split(' | ')[0].split('-')[1],
                day: comment.date.split(' | ')[0].split('-')[0],
                time: comment.date.split(' | ')[1]
            };

            const query = {videoId: this._id, commentId: comment.id};

            return DumpertComment.findOneAndUpdate(query, {
                videoId: this._id,
                commentId: comment.id,
                kudos: comment.kudos,
                content: comment.content,
                user: comment.user,
                published: new Date(`20${date.year}-${date.month}-${date.day} ${date.time}:00 +0100`)
            }, {upsert: true}).exec().then(doc => {

                if(doc && doc.deleted.deleted) return;

                let status = 0;

                if(comment.content == '-weggejorist en opgerot-'){
                    status = 2;
                }
                else if(comment.content == '-weggejorist-'){
                    status = 1;
                }

                if(status == 0) return;

                return DumpertComment.findOneAndUpdate(query, {
                    deleted: {
                        deleted: true,
                        banned: status == 2,
                        detectedAt: new Date(),
                        originalContent: doc ? doc.content : null
                    }
                }).exec();


            });

        });

    });

};

module.exports = mongoose.model('DumpertVideo', DumpertVideo);