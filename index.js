import { XMLParser } from "fast-xml-parser";
import miiJS from "@pretendonetwork/mii-js";
import tga2png from "tga2png";
import fs from "fs";
import zlib from "zlib";

// const miiData = 'AwEAMLrDTIqIpLZhlH8Ps6TA4eK42QAAAFAOMHPgSQBtAG8AcgBhAHPgDzAAAGsrAgA5AQJoRBgm\r\nNEYUgRIWaA0AACmGAUhQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG7s';
// const mii = new miiJS.default(Buffer.from(miiData, 'base64'));
// mii.hairType = 1;
// mii.favoriteColor = 7;
// const studioUrl = mii.studioUrl({
// 	width: 512,
// 	bgColor: '131733FF'
// });

// console.log(studioUrl);

export async function getWaraWaraData() {
    const f = await fetch("http://api.olv.pretendo.cc/v1/topics");
    const t = await f.text();

    const parser = new XMLParser();
    let json = parser.parse(t).result.topics.topic;
    json = json.map(topic => {
        delete topic.empathy_count;
        delete topic.has_shop_page;
        delete topic.title_ids;
        delete topic.title_id;
        delete topic.is_recommended;
        // delete topic.position;

        topic.icon = zlib.inflateSync(Buffer.from(topic.icon, "base64")).toString("base64");
        
        topic.people = topic.people.person.map(person => person.posts.post);
        topic.people = topic.people.map(person => {
            delete person.id;
            delete person.is_autopost;
            delete person.is_community_private_autopost;
            delete person.is_spoiler;
            delete person.is_app_jumpable;
            delete person.platform_id;

            // ugh i hate this line so much
            const mii = new miiJS.default(Buffer.from(person.mii, "base64"));
            person.mii = JSON.parse(JSON.stringify(mii));
            
            delete person.mii.bitStream;
            delete person.mii.systemId;
            delete person.mii.consoleMAC;
            delete person.mii.version;
            delete person.mii.profanityFlag;
            delete person.mii.allowCopying;
            delete person.mii.regionLock;
            delete person.mii.characterSet;
            delete person.mii.pageIndex;
            delete person.mii.slotIndex;
            delete person.mii.unknown1;
            delete person.mii.deviceOrigin;
            delete person.mii.normalMii;
            delete person.mii.dsMii;
            delete person.mii.nonUserMii;
            delete person.mii.creationTime;
            delete person.mii.birthMonth;
            delete person.mii.birthDay;
            delete person.mii.favorite;
            delete person.mii.miiName;
            delete person.mii.disableSharing;
            delete person.mii.unknown2;
            delete person.mii.creatorName;
            delete person.mii.checksum;
            delete person.mii.isValid;

            if(typeof person.painting !== "undefined")
                person.painting = person.painting.url;

            return person;
        });

        return topic;
    });
    return json;
}