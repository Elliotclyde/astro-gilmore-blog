import { defineConfig } from "astro/config";
import { fetchEpisodes } from "./src/lib/Airtable";
import { promises as fs } from "fs";
import * as webp from "webp-converter";

webp.grant_permission();

function addImagesToAssetsOnBuild() {
  return {
    name: "addImagesToAssetsOnBuild",
    hooks: {
      "astro:build:done": async () => {
        const episodes = await fetchEpisodes();
        await Promise.all([
          ...episodes.map((episode, index) => {
            return new Promise(async (resolve, reject) => {
              try {
                if (episode.image) {
                  const url = episode.image.url;
                  const response = await fetch(url);
                  const blob = await response.blob();
                  const arrayBuffer = await blob.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  await fs.writeFile(
                    `dist/assets/images/episodes/episode${index}.jpg`,
                    buffer
                  );
                  await webp.cwebp(
                    `dist/assets/images/episodes/episode${index}.jpg`,
                    `dist/assets/images/episodes/episode${index}.webp`
                  );
                  resolve(true);
                }
              } catch (e) {
                reject(e);
              }
            });
          }),
          ...episodes.map((episode, index) => {
            return new Promise(async (resolve, reject) => {
              try {
                if (episode.image) {
                  const url = episode.image.thumbnails.large.url;
                  const response = await fetch(url);
                  const blob = await response.blob();
                  const arrayBuffer = await blob.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  await fs.writeFile(
                    `dist/assets/images/episodes/episode${index}medium.jpg`,
                    buffer
                  );
                  await webp.cwebp(
                    `dist/assets/images/episodes/episode${index}medium.jpg`,
                    `dist/assets/images/episodes/episode${index}medium.webp`
                  );
                  resolve(true);
                }
              } catch (e) {
                reject(e);
              }
            });
          }),
          ...episodes.map((episode, index) => {
            return new Promise(async (resolve, reject) => {
              try {
                if (episode.image) {
                  const url = episode.image.thumbnails.small.url;
                  const response = await fetch(url);
                  const blob = await response.blob();
                  const arrayBuffer = await blob.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  await fs.writeFile(
                    `dist/assets/images/episodes/episode${index}small.jpg`,
                    buffer
                  );
                  await webp.cwebp(
                    `dist/assets/images/episodes/episode${index}small.jpg`,
                    `dist/assets/images/episodes/episode${index}small.webp`
                  );
                  resolve(true);
                }
              } catch (e) {
                reject(e);
              }
            });
          }),
        ]);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://www.gizmogirls.tech",
  integrations: [addImagesToAssetsOnBuild()],
});
