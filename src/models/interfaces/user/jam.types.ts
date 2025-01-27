import {User} from "./user.types";

export enum JamStatus {
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  STOPPED = "STOPPED",
  SCHEDULED = "SCHEDULED",
  CANCELED = "CANCELED",
}

export interface Jam {
  id: number;
  name: string;
  host: User;
  status: JamStatus;
  background: string;
  description: string;
  participants: User[];
  themes: string[];
  comments: Comment[];
  likes: number;
}
