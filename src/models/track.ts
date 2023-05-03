import { Document, Schema, model } from "mongoose";

interface TrackDocumentInterface extends Document {
  id: number;
  name: string;
  beginning_coords: [number, number];
  ending_coords: [number, number];
  length: number;
  slope: number;
  users: string[];
  activity_type: "Correr" | "Bicicleta";
  average_score: number;
}

const TrackSchema = new Schema<TrackDocumentInterface>({
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
  beginning_coords: {
    type: [Number],
    required: true,
    validate: (value: number[]) => {
      if (value[0] < -90 || value[0] > 90) {
        throw new Error(
          "La latitud de las coordenadas iniciales debe estar entre -90 y 90 grados"
        );
      } else if (value[1] < -180 || value[1] > 180) {
        throw new Error(
          "La longitud de las coordenadas iniciales debe estar entre -180 y 180 grados"
        );
      }
    },
  },
  ending_coords: {
    type: [Number],
    required: true,
    validate: (value: number[]) => {
      if (value[0] < -90 || value[0] > 90) {
        throw new Error(
          "La latitud de las coordenadas finales debe estar entre -90 y 90 grados"
        );
      } else if (value[1] < -180 || value[1] > 180) {
        throw new Error(
          "La longitud de las coordenadas finales debe estar entre -180 y 180 grados"
        );
      }
    },
  },
  length: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value <= 0) {
        throw new Error("La longitud de la ruta debe ser positiva");
      }
    },
  },
  slope: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value <= 0) {
        throw new Error("El desnivel de la ruta debe ser positiva");
      }
    },
  },
  users: {
    type: [String],
    required: true,
  },
  activity_type: {
    type: String,
    required: true,
    default: "Correr",
    enum: ["Correr", "Bicicleta"],
  },
  average_score: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0 || value > 10) {
        throw new Error(
          "La puntuacion media tiene que ser mayor o igual que 0 y menor o igual 10"
        );
      }
    },
  },
});

export const Track = model<TrackDocumentInterface>("Ruta", TrackSchema);
