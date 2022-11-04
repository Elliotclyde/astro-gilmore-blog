import Airtable from "airtable";
import dotenv from "dotenv";
import { marked } from "marked";

export type Episode = {
  slug: string;
  title: string;
  subtitle: string;
  body: string;
  date: Date;
  image: any;
};

export async function fetchEpisodes(): Promise<Array<Episode>> {
  dotenv.config();
  Airtable.configure({
    endpointUrl: "https://api.airtable.com",
    apiKey: process.env.AIRTABLE_API_KEY,
  });

  return new Promise((resolve, reject) => {
    try {
      let posts = [];
      const base = Airtable.base("appn8dKElhkMDkcVz");
      base("episodes")
        .select({
          view: "Grid view",
        })
        .eachPage(
          function page(records, fetchNextPage) {
            try {
              records.forEach(function (record) {
                posts.push({
                  slug: record.get("Slug"),
                  title: record.get("Title"),
                  subtitle: record.get("Subtitle"),
                  //@ts-ignore
                  body: marked.parse(record.get("Body")),
                  date: record.get("Date Added"),
                  image: record.get("Hero Image")[0],
                });
              });
            } catch (e) {
              console.log("error inside eachPage => ", e);
            }
            fetchNextPage();
          },
          function done(err) {
            if (err) {
              reject(err);
              console.error(err);
              return;
            } else {
              resolve(posts);
            }
          }
        );
    } catch (e) {
      reject(e);
    }
  });
}
