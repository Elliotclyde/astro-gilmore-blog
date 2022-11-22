import rss from "@astrojs/rss";

import { fetchEpisodes } from "../lib/Airtable";
const posts = await fetchEpisodes();

export const get = () =>
  rss({
    // `<title>` field in output xml
    title: "Gizmo Girls",
    // `<description>` field in output xml
    description: `A blog about the interaction between the Gilmore Girls TV show and
    technology`,
    // base URL for RSS <item> links
    // SITE will use "site" from your project's astro.config.
    site: import.meta.env.SITE,
    // list of `<item>`s in output xml
    // simple example: generate items for every md file in /src/pages
    // see "Generating items" section for required frontmatter and advanced use cases
    items: posts.map((post) => ({
      link: import.meta.env.SITE + "episodes/" + post.slug,
      title: post.title,
      pubDate: post.date,
    })),
    // (optional) inject custom xml
    customData: `<language>en-us</language>`,
  });
