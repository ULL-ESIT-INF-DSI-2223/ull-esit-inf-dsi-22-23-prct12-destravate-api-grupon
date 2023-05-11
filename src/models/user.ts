import { Document, Schema, model } from "mongoose";
import { TrackDocumentInterface } from "./track.js";
import {
  HistoricalElementDocumentInterface,
  HistoricalElementSchema,
} from "./historical_element.js";
import { GroupDocumentInterface } from "./group.js";
import { ChallengeDocumentInterface } from "./challenge.js";

export interface UserDocumentInterface extends Document {
  id: string;
  name: string;
  activity_type: "Correr" | "Bicicleta";
  friends: UserDocumentInterface[];
  groups: GroupDocumentInterface[];
  statistics: [[number, number], [number, number], [number, number]];
  favourite_tracks: TrackDocumentInterface[];
  active_challenges: ChallengeDocumentInterface[];
  tracks_historical: HistoricalElementDocumentInterface[];
}

const UserSchema = new Schema<UserDocumentInterface>({
  id: {
    type: String,
    unique: true,
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
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Group",
  },
  statistics: {
    type: [[Number]],
    required: true,
    validate: (value: number[][]) => {
      if (
        value.length != 3 ||
        value[0].length != 2 ||
        value[1].length != 2 ||
        value[2].length != 2
      ) {
        throw new Error("Formato incorrecto en las estadísticas del usuario");
      }
      if (value[0][0] < 0) {
        throw new Error(
          "Los kilómetros semanales deben ser iguales o mayores a 0"
        );
      }
      if (value[0][1] < 0) {
        throw new Error("El desnivel semanal debe ser igual o mayor a 0");
      }
      if (value[1][0] < 0) {
        throw new Error(
          "Los kilómetros mensuales deben ser iguales o mayores a 0"
        );
      }
      if (value[1][1] < 0) {
        throw new Error("El desnivel mensual debe ser igual o mayor a 0");
      }
      if (value[2][0] < 0) {
        throw new Error(
          "Los kilómetros anuales deben ser iguales o mayores a 0"
        );
      }
      if (value[2][1] < 0) {
        throw new Error("El desnivel anual debe ser igual o mayor a 0");
      }
    },
  },
  favourite_tracks: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Track",
  },
  active_challenges: {
    type: [Schema.Types.ObjectId],
    required: true,
  },
  tracks_historical: {
    type: [HistoricalElementSchema],
    required: true,
  },
});

export const User = model<UserDocumentInterface>("User", UserSchema);
