/*eslint no-constant-condition: "off", no-console: "off"*/

import mongoose from 'mongoose';
import DumpertVideo from '../models/DumpertVideo';
import DumpertPage from '../models/DumpertPage';
import importPage from './importPage';
import importComments from './importComments';

// Set up mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/weggejorist');
mongoose.Promise = Promise;

/**
 * Import the page that was scanned the longest time ago
 */
(async function() {
    while(true) {
        try {
            const page = await DumpertPage.findOne({}).sort({lastScanned: 1}).exec();
            if(page){
                await importPage(page.number);
            }
        }
        catch(e) {
            console.log(e);
        }

        await new Promise(r => setTimeout(r, 1000));
    }
})();

/**
 * Import the first page every minute to pick up new videos faster
 */
(async function() {
    while(true) {
        try{
            await importPage(1);
        }
        catch(e) {
            console.log(e);
        }
        await new Promise(r => setTimeout(r, 60 * 1000));
    }
})();

/**
 * Make sure all pages get imported, by checking if the last page contained 15 items.
 * If it does, scan page number + 1.
 */
(async function() {
    while(true) {
        try {
            const page = await DumpertPage.findOne({}).sort({number: -1}).exec();
            if(page.results == 15) {
                await importPage(page.number + 1);
            }
            else {
                await new Promise(r => setTimeout(r, 60 * 1000));
            }
        }
        catch(e) {
            console.log(e);
            await new Promise(r => setTimeout(r, 60 * 1000));
        }
    }
})();

/**
 * Import comments for video that was scanned the longest time ago
 */
(async function() {
    while(true) {
        try {
            const videos = await DumpertVideo.find().sort({commentsLastScanned: 1}).limit(5).exec();
            if(videos && videos.length) {
                await Promise.all(videos.map(video => importComments(video)));
                console.log('queue done.');
            }
            else {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        catch(e) {
            console.log(e);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
})();

/**
 * Import comments for video that was scanned the longest time ago from the last 100 videos
 */

(async function() {
    while(true) {
        try {
            const videos = await DumpertVideo.aggregate([
                {$sort: {published: -1}},
                {$limit: 100},
                {$sort: {commentsLastScanned: 1}},
                {$limit: 1}
            ]).exec();
            if(videos && videos.length) {
                await Promise.all(videos.map(video => importComments(video)));
            }
        }
        catch(e) {
            console.log(e);
        }

        await new Promise(r => setTimeout(r, 10 * 1000));
    }
})();