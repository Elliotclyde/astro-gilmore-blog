import { Episode } from "./Airtable";

export function getImageUrlForEpisode(episode: Episode, size: string) {
  const image = episode.image;
  if (import.meta.env.MODE === "development") {
    switch (size) {
      case "large":
        return image.url;
      case "medium":
        return image.thumbnails.large.url;
      case "small":
        return image.thumbnails.small.url;
    }
    return episode.image.url;
  }
  if (import.meta.env.MODE === "production") {
    switch (size) {
      case "large":
        return `/assets/images/episodes/episode${episode.index}.jpg`;
      case "medium":
        return `/assets/images/episodes/episode${episode.index}medium.jpg`;
      case "small":
        return `/assets/images/episodes/episode${episode.index}small.jpg`;
    }
  }
  throw new Error("Use either production or development for vite mode");
}
