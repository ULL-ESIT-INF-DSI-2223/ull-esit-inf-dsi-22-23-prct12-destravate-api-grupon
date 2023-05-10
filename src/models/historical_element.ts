import { Document, Schema, model } from "mongoose";
import { TrackDocumentInterface } from "./track.js";

export interface HistoricalElementDocumentInterface extends Document {
  date: Date;
  track: TrackDocumentInterface;
}

export const HistoricalElementSchema =
  new Schema<HistoricalElementDocumentInterface>(
    {
      date: {
        type: Date,
        required: true,
        validate: (value: Date) => {
          if (value > new Date()) {
            throw new Error(
              "La fecha de las rutas del historial no puede ser futura"
            );
          }
        },
      },
      track: { type: Schema.Types.ObjectId, required: true, ref: "Track" },
    },
    { _id: false }
  );

export const HistoricalElement = model<HistoricalElementDocumentInterface>(
  "HistoricalElement",
  HistoricalElementSchema
);
