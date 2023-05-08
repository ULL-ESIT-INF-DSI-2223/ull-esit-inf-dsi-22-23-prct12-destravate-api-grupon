import express from "express";
import { User } from "../models/user.js";
import { Track } from "../models/track.js";

export const userRouter = express.Router();

userRouter.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    let historical_tracks_exist = true;
    for (
      let i = 0;
      i < user.tracks_historical.length && historical_tracks_exist;
      i++
    ) {
      const found = await Track.findOne(user.tracks_historical[i]);
      if (!found) {
        historical_tracks_exist = false;
      }
    }
    if (!historical_tracks_exist) {
      return res
        .status(500)
        .send("Ruta/s introducida/s no encontrada en la base de datos");
    }

    await user.save();
    return res.status(201).send(user);
  } catch (error) {
    return res.status(500).send(error);
  }
});
