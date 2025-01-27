import {User} from "./user.types";

export enum EventStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
}

export interface Event {
  id: number;
  name: string;
  status: EventStatus;
  background: string;
  description: string;
  scheduledDate: Date;
  participants: User[];
  themes: string[];
  address: string;
}
