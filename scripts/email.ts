// Run with:
// npx ts-node-esm scripts/email.ts 1 1

import * as nodemailer from "nodemailer";
import * as azure from "@azure/storage-blob";
import dotenv from "dotenv";
import Airtable from "airtable";
import { micromark } from "micromark";

let BlockBlobClient = azure.BlockBlobClient;

export type Episode = {
  slug: string;
  title: string;
  subtitle: string;
  body: string;
  date: Date;
  image: any;
  imageAlt: string;
  episodeNumber: number;
  seasonNumber: number;
  index: number;
  markdownBody: string;
};

async function fetchEpisodes(): Promise<Array<Episode>> {
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
                if (record.get("Is draft") != "True") {
                  if (record.get("Body")) {
                    posts.push({
                      slug: record.get("Slug"),
                      title: record.get("Title"),
                      subtitle: record.get("Subtitle"),
                      //@ts-ignore
                      markdownBody: record.get("Body") as string,
                      body: micromark(record.get("Body") as string),
                      date: record.get("Date Added"),
                      image: record.get("Hero Image")[0],
                      episodeNumber: record.get("Episode"),
                      seasonNumber: record.get("Season"),
                      index: posts.length,
                      imageAlt: record.get("Image alt"),
                    });
                  }
                }
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

dotenv.config();

const seasonNumber = process.argv[2];
const episodeNumber = process.argv[3];
console.log(seasonNumber);
console.log(episodeNumber);

const blobService = new BlockBlobClient(
  process.env.AZURE_STORAGE_CONNECTION_STRING,
  process.env.AZURE_STORAGE_CONTAINER_NAME,
  "mailinglist.txt"
);

async function getBodyAsString(): Promise<string> {
  const blobDownload = await blobService.download();
  return (await streamToString(blobDownload.readableStreamBody)) as string;
}

async function getTable() {
  const currentBody = await getBodyAsString();
  return currentBody.split("\n").map((line) => line.split(","));
}

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString());
    });
    readableStream.on("error", reject);
  });
}

async function main() {
  const articles = await fetchEpisodes();
  const article = articles.find(
    (a) =>
      a.seasonNumber == parseInt(seasonNumber) &&
      a.episodeNumber == parseInt(episodeNumber)
  );

  if (!article) {
    throw new Error("article not found");
  }

  let transporter = nodemailer.createTransport({
    host: "smtp.zoho.com.au",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emails = (await getTable()).filter((r) => r[0].includes("@"));
  emails.forEach(async (pair) => {
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Gizmo Girls 🍁" <hugh@gizmogirls.tech>', // sender address
      to: pair[0], // list of receivers
      subject: article.title, // Subject line
      text: article.markdownBody, // plain text body
      html:
        `<table>
      <td width="350px"><p>Your gizmo girls update:</p><h1>${article.title}</h1><p><em>Gizmo Girls, Season ${article.seasonNumber}, Episode ${article.episodeNumber}</em></p>
        <a href="https://www.gizmogirls.tech/episodes/${article.slug}">Read on the web</a><br/>
        <img style="object-fit: cover;" width="350px" height="225px" src="https://www.gizmogirls.tech/assets/images/episodes/episode${article.index}.jpg" alt="${article.imageAlt}"/>` +
        article.body +
        `<p>-Hugh</p>
        <br/>
        <a href="https://www.gizmogirls.tech">Gizmo Girls</a>
        <br/>
        <a href="https://gizmosubscription2.azurewebsites.net/api/managesubscription?code=vKCNSJaCBQNmjHvRuDHgAG4R0wGwrweBSl0V6IMhSzgsAzFuSwMyFg==&action=unsubscribe&guid=${pair[1]}">Unsubscribe?</a>
        </td></table>`, // html body
    });

    console.log("Message sent: %s", info.messageId);

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  });
}

main().catch(console.error);
