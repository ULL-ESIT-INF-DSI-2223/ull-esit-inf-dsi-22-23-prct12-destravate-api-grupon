import express from "express";
import { Track, TrackDocumentInterface } from "../models/track.js";
import { User, UserDocumentInterface } from "../models/user.js";
import { HistoricalElementDocumentInterface } from "../models/historical_element.js";

export const trackRouter = express.Router();

trackRouter.post("/tracks", async (req, res) => {
  try {
    const users: UserDocumentInterface[] = [];
    for (let index = 0; index < req.body.users.length; index++) {
      const user = await User.findOne({
        id: req.body.users[index],
      });
      if (!user) {
        return res.status(404).send({
          error: `El usuario ${index} de la ruta introducida no existe`,
        });
      } else {
        users.push(user._id);
      }
    }

    const track = new Track({ ...req.body, users: users });
    await track.save();
    await track.populate({
      path: "users",
      select: ["id", "name"],
    });
    return res.status(201).send(track);
  } catch (error) {
    return res.status(500).send(error);
  }
});

trackRouter.get("/tracks", async (req, res) => {
  try {
    const filter = req.query.name ? { name: req.query.name } : {};

    const tracks = await Track.find(filter).populate({
      path: "users",
      select: ["id", "name"],
    });

    if (tracks.length !== 0) {
      return res.send(tracks);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

trackRouter.get("/tracks/:id", async (req, res) => {
  try {
    const filter = req.params.id ? { id: req.params.id } : {};

    const tracks = await Track.find(filter).populate({
      path: "users",
      select: ["id", "name"],
    });

    if (tracks.length !== 0) {
      return res.send(tracks);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

trackRouter.patch("/tracks", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    const users: UserDocumentInterface[] = [];
    for (let index = 0; index < req.body.users.length; index++) {
      const user = await User.findOne({
        id: req.body.users[index],
      });
      if (!user) {
        return res.status(404).send({
          error: `El usuario ${index} de la ruta introducida no existe`,
        });
      } else {
        users.push(user._id);
      }
    }

    const allowedUpdates = [
      "name",
      "beginning_coords",
      "ending_coords",
      "length",
      "slope",
      "users",
      "activity_type",
      "average_score",
    ];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidUpdate) {
      return res.status(400).send({
        error: "Actualización no permitida",
      });
    }
    const track = await Track.findOneAndUpdate(
      { name: req.query.name.toString() },
      { ...req.body, users: users },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "users",
      select: ["id", "name"],
    });

    if (track) {
      return res.send(track);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

trackRouter.patch("/tracks/:id", async (req, res) => {
  try {
    const users: UserDocumentInterface[] = [];
    for (let index = 0; index < req.body.users.length; index++) {
      const user = await User.findOne({
        id: req.body.users[index],
      });
      if (!user) {
        return res.status(404).send({
          error: `El usuario ${index} de la ruta introducida no existe`,
        });
      } else {
        users.push(user._id);
      }
    }

    const allowedUpdates = [
      "name",
      "beginning_coords",
      "ending_coords",
      "length",
      "slope",
      "users",
      "activity_type",
      "average_score",
    ];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidUpdate) {
      return res.status(400).send({
        error: "Actualización no permitida",
      });
    }
    const track = await Track.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, users: users },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: "users",
      select: ["id", "name"],
    });

    if (track) {
      return res.send(track);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

trackRouter.delete("/tracks", async (req, res) => {
  try {
    // Name is required
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    } else {
      // If track exist we proceed if not sent not found
      const track = await Track.findOneAndDelete({
        name: req.query.name.toString(),
      });
      if (!track) {
        return res.status(404).send();
      } else {
        // List of all Users
        const user_list = await User.find();

        // Search if any user has this route in his historical or in favourites
        for (let i = 0; i < user_list.length; i++) {
          let found_favourite = false;
          let found_historical = false;
          const favourite_user_tracks: TrackDocumentInterface[] = [];
          const user_tracks_historical: HistoricalElementDocumentInterface[] =
            [];

          // Check favourites
          for (let j = 0; j < user_list[i].favourite_tracks.length; j++) {
            if (user_list[i].favourite_tracks[j].equals(track._id)) {
              found_favourite = true;
            } else {
              favourite_user_tracks.push(user_list[i].favourite_tracks[j]);
            }
          }

          // If found we update favourites
          if (found_favourite) {
            await User.findByIdAndUpdate(
              user_list[i]._id,
              { favourite_tracks: favourite_user_tracks },
              {
                new: true,
                runValidators: true,
              }
            );
          }

          // Check historical
          for (let j = 0; j < user_list[i].tracks_historical.length; j++) {
            if (user_list[i].tracks_historical[j].track.equals(track._id)) {
              found_historical = true;
            } else {
              user_tracks_historical.push(user_list[i].tracks_historical[j]);
            }
          }
          // If found we update historical
          if (found_historical) {
            await User.findByIdAndUpdate(
              user_list[i]._id,
              { tracks_historical: user_tracks_historical },
              {
                new: true,
                runValidators: true,
              }
            );
          }
        }

        await track.populate({
          path: "users",
          select: ["id", "name"],
        });
        return res.send(track);
      }
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

trackRouter.delete("/tracks/:id", async (req, res) => {
  try {
    // If track exist we proceed if not sent not found
    const track = await Track.findOneAndDelete({ id: req.params.id });
    if (!track) {
      return res.status(404).send();
    } else {
      // List of all Users
      const user_list = await User.find();

      // Search if any user has this route in his historical or in favourites
      for (let i = 0; i < user_list.length; i++) {
        let found_favourite = false;
        let found_historical = false;
        const favourite_user_tracks: TrackDocumentInterface[] = [];
        const user_tracks_historical: HistoricalElementDocumentInterface[] = [];

        // Check favourites
        for (let j = 0; j < user_list[i].favourite_tracks.length; j++) {
          if (user_list[i].favourite_tracks[j].equals(track._id)) {
            found_favourite = true;
          } else {
            favourite_user_tracks.push(user_list[i].favourite_tracks[j]);
          }
        }

        // If found we update favourites
        if (found_favourite) {
          await User.findByIdAndUpdate(
            user_list[i]._id,
            { favourite_tracks: favourite_user_tracks },
            {
              new: true,
              runValidators: true,
            }
          );
        }

        // Check historical
        for (let j = 0; j < user_list[i].tracks_historical.length; j++) {
          if (user_list[i].tracks_historical[j].track.equals(track._id)) {
            found_historical = true;
          } else {
            user_tracks_historical.push(user_list[i].tracks_historical[j]);
          }
        }
        // If found we update historical
        if (found_historical) {
          await User.findByIdAndUpdate(
            user_list[i]._id,
            { tracks_historical: user_tracks_historical },
            {
              new: true,
              runValidators: true,
            }
          );
        }
      }
      await track.populate({
        path: "users",
        select: ["id", "name"],
      });
      return res.send(track);
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});
