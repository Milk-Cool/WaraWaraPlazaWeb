import { XMLParser } from "fast-xml-parser";
import Mii from "@pretendonetwork/mii-js";
import tga2png from "tga2png";
import fs from "fs";
import zlib from "zlib";

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
        delete topic.position;

        topic.icon = zlib.inflateSync(Buffer.from(topic.icon, "base64"));
        
        topic.people = topic.people.person.map(person => person.posts.post);
        topic.people = topic.people.map(person => {
            delete person.id;
            delete person.is_autopost;
            delete person.is_community_private_autopost;
            delete person.is_spoiler;
            delete person.is_app_jumpable;
            delete person.platform_id;

            return person;
        });

        return topic;
    });
    return json;
}