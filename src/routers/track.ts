import express from "express";
import { Track } from "../models/track.js";
import { User } from "../models/user.js";

export const trackRouter = express.Router();

trackRouter.post("/tracks", async (req, res) => {
  try {
    const track = new Track(req.body);

    for (let index = 0; index < track.users.length; index++) {
      const user = await User.findOne({
        id: track.users[index],
      });
      if (!user) {
        return res.status(404).send({
          error: `El usuario ${index} de la ruta introducida no existe`,
        });
      } else {
        track.users[index] = user._id;
      }
    }

    await track.save();
    return res.status(201).send(track);
  } catch (error) {
    return res.status(400).send(error);
  }
});

trackRouter.get("/tracks", (req, res) => {
  const filter = req.query.name ? { name: req.query.name } : {};

  Track.find(filter)
    .then((track) => {
      if (track.length !== 0) {
        res.send(track);
      } else {
        res.status(404).send();
      }
    })
    .catch(() => {
      res.status(500).send();
    });
});

trackRouter.get("/tracks/:id", (req, res) => {
  const filter = req.params.id ? { id: req.params.id } : {};
  Track.find(filter)
    .then((track) => {
      if (track.length !== 0) {
        res.send(track);
      } else {
        res.status(404).send();
      }
    })
    .catch(() => {
      res.status(500).send();
    });
});

trackRouter.patch("/tracks", (req, res) => {
  if (!req.query.name) {
    res.status(400).send({
      error: "Se debe proporcionar un nombre",
    });
  } else {
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
      res.status(400).send({
        error: "Actualización no permitida",
      });
    } else {
      Track.findOneAndUpdate({ name: req.query.name.toString() }, req.body, {
        new: true,
        runValidators: true,
      })
        .then((track) => {
          if (!track) {
            res.status(404).send();
          } else {
            res.send(track);
          }
        })
        .catch((error) => {
          res.status(400).send(error);
        });
    }
  }
});

trackRouter.patch("/tracks/:id", (req, res) => {
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
    res.status(400).send({
      error: "Actualización no permitida",
    });
  } else {
    Track.findOneAndUpdate({ id: req.params.id }, req.body, {
      new: true,
      runValidators: true,
    })
      .then((track) => {
        if (!track) {
          res.status(404).send();
        } else {
          res.send(track);
        }
      })
      .catch((error) => {
        res.status(400).send(error);
      });
  }
});

trackRouter.delete("/tracks", (req, res) => {
  if (!req.query.name) {
    res.status(400).send({
      error: "Se debe proporcionar un nombre",
    });
  } else {
    Track.findOneAndDelete({ name: req.query.name.toString() })
      .then((track) => {
        if (!track) {
          res.status(404).send();
        } else {
          res.send(track);
        }
      })
      .catch(() => {
        res.status(400).send();
      });
  }
});

trackRouter.delete("/tracks/:id", (req, res) => {
  Track.findOneAndDelete({ id: req.params.id })
    .then((track) => {
      if (!track) {
        res.status(404).send();
      } else {
        res.send(track);
      }
    })
    .catch(() => {
      res.status(400).send();
    });
});
