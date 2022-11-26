import { defineConfig } from "astro/config";
import { fetchEpisodes } from "./src/lib/Airtable";
import { promises as fs } from "fs";

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
                    `./dist/assets/images/episodes/episode${index}.jpg`,
                    buffer
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
                    `./dist/assets/images/episodes/episode${index}medium.jpg`,
                    buffer
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
                    `./dist/assets/images/episodes/episode${index}small.jpg`,
                    buffer
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
  site: "http://localhost:3000",
  integrations: [addImagesToAssetsOnBuild()],
});
