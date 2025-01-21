import {Playlist} from "./playlist.types";
import {Jam} from "./jam.types";
import {Badge} from "./badges.types";

export interface User {
  id: string;
  name: string;
  playlists: Playlist[];
  events: Event[];
  jams: Jam[];
  badges: Badge[];
  email: string;
  country: string;
  provider: string;
  imgUrl: string;
  userProviderId: string;
  roles: string[];
}
