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

    console.log('START XRAY!', url);

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

            console.log(comment);

            const date = {
                year: comment.date.split(' | ')[0].split('-')[2],
                month: comment.date.split(' | ')[0].split('-')[1],
                day: comment.date.split(' | ')[0].split('-')[0],
                time: comment.date.split(' | ')[1]
            };

            return DumpertComment.findOneAndUpdate({videoId: this._id, commentId: comment.id}, {
                videoId: this._id,
                commentId: comment.id,
                kudos: comment.kudos,
                content: comment.content,
                user: comment.user,
                published: new Date(`20${date.year}-${date.month}-${date.day} ${date.time}:00 +0100`)
            }, {upsert: true}).exec();

        });

    });

};

module.exports = mongoose.model('DumpertVideo', DumpertVideo);