import { Document, Schema, model } from "mongoose";
import { TrackDocumentInterface } from "./track.js";
import {
  HistoricalElementDocumentInterface,
  HistoricalElementSchema,
} from "./historical_element.js";
import { UserDocumentInterface } from "./user.js";

export interface GroupDocumentInterface extends Document {
  id: number;
  name: string;
  participants: UserDocumentInterface[];
  statistics: [[number, number], [number, number], [number, number]];
  ranking: UserDocumentInterface[];
  favourite_tracks: TrackDocumentInterface[];
  tracks_historical: HistoricalElementDocumentInterface[];
}

const GroupSchema = new Schema<GroupDocumentInterface>({
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
  participants: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "User",
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
  ranking: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "User",
  },
  favourite_tracks: {
    type: [Schema.Types.ObjectId],
    required: true,
    ref: "Track",
  },
  tracks_historical: {
    type: [HistoricalElementSchema],
    required: true,
  },
});

export const Group = model<GroupDocumentInterface>("Group", GroupSchema);
