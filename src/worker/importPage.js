
import DumpertPage from '../models/DumpertPage';
import DumpertVideo from '../models/DumpertVideo';

import { getLatest } from 'dumpert-api';

export default async function (page) {
    try {

        const result = await getLatest(page);

        // Get errors
        if(result.errors) {
            if(result.errors.includes('Out of items!')) {
                result.items = [];
            }
            else {
                throw Error(result.errors.join(' - '));
            }
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

        await DumpertPage.findOneAndUpdate({number: page}, {number: page, lastScanned: new Date(), results: result.items.length}, {upsert:true}).exec();

        return result.items.length;

    }
    catch (e) {
        console.log(`Error inserting videos from page ${page}`);
        console.log(e);

        /**
         * Very dirty fix!
         * On some pages the JSON is improperly formatted, which makes the getLatest call fail.
         * Example videos: 6856979_92626b8f
         * On pages below the currently known number of pages, we will set 15 as number of results just so the crawler
         * will continue to look for more pages.
         */
        if(page < 6000) {

            try {
                await DumpertPage.findOneAndUpdate({number: page}, {number: page, lastScanned: new Date(), results: 15}, {upsert:true}).exec();
            }
            catch(e){
                console.log(e);
            }
        }
    }
}