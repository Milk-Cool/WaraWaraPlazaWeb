import { XMLParser } from "fast-xml-parser";
import Mii from "@pretendonetwork/mii-js";
import tga2png from "tga2png";

export async function getWaraWaraData() {
    const f = await fetch("http://api.olv.pretendo.cc/v1/topics");
    const t = await f.text();

    const parser = new XMLParser();
    const json = parser.parse(t);
    console.log(json);
}