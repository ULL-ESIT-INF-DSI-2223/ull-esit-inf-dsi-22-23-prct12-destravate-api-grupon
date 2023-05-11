import { Document, Schema, model } from "mongoose";
import { UserDocumentInterface } from "./user.js";
import { TrackDocumentInterface } from "./track.js";

export interface ChallengeDocumentInterface extends Document {
  id: number;
  name: string;
  tracks: TrackDocumentInterface[];
  activity_type: "Correr" | "Bicicleta";
  length: number;
  users: UserDocumentInterface[];
}

const ChallengeSchema = new Schema<ChallengeDocumentInterface>({
  id: {
    type: Number,
    unique: true,
    required: true,
    validate: (value: number) => {
      if (value < 0 || value % 1 !== 0) {
        throw new Error("El ID de la ruta debe ser un entero positivo");
      }
    },
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  tracks: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Track",
  },
  activity_type: {
    type: String,
    required: true,
    default: "Correr",
    enum: ["Correr", "Bicicleta"],
  },
  length: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value <= 0) {
        throw new Error("La longitud del reto debe ser positiva");
      }
    },
  },
  users: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "User",
  },
});

export const Challenge = model<ChallengeDocumentInterface>(
  "Challenge",
  ChallengeSchema
);
