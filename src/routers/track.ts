import express from "express";
import { Track } from "../models/track.js";
import { User, UserDocumentInterface } from "../models/user.js";

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
    return res.status(400).send(error);
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
