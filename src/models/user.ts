import { Document, Schema, model } from "mongoose";
import { TrackDocumentInterface } from "./track.js";

export interface UserDocumentInterface extends Document {
  id: string;
  name: string;
  activity_type: "Correr" | "Bicicleta";
  friends: UserDocumentInterface[];
  groups: number[];
  statistics: [[number, number], [number, number], [number, number]];
  favourite_tracks: TrackDocumentInterface[];
  active_challenges: number[];
  tracks_historical: [Date, TrackDocumentInterface][];
}

const UserSchema = new Schema<UserDocumentInterface>({
  id: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  activity_type: {
    type: String,
    required: true,
    default: "Correr",
    enum: ["Correr", "Bicicleta"],
  },
  friends: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "User",
  },
  groups: {
    type: [Number],
    required: true,
  },
  statistics: {
    type: [[Number]],
    required: true,
  },
  favourite_tracks: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Track",
  },
  active_challenges: {
    type: [Number],
    required: true,
  },
  tracks_historical: {
    type: [[Date, Schema.Types.ObjectId]],
    required: true,
    ref: "Track",
  },
});

export const User = model<UserDocumentInterface>("User", UserSchema);
