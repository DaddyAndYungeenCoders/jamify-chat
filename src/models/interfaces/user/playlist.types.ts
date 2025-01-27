import {Tag} from "swagger-jsdoc";

export interface Playlist {
  id: number;
  name: string;
  tags: Tag[];
  musics: number[];
  likes: number;
  image: string;
}
