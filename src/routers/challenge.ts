import express from "express";
import { Track, TrackDocumentInterface } from "../models/track.js";
import { User, UserDocumentInterface } from "../models/user.js";
import { Challenge, ChallengeDocumentInterface } from "../models/challenge.js";

export const challengeRouter = express.Router();

challengeRouter.post("/challenges", async (req, res) => {
  try {
    let tracks: TrackDocumentInterface[] = [];
    let users: UserDocumentInterface[] = [];
    try {
      tracks = await checkTracks(req.body.tracks);
      users = await checkUsers(req.body.users);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const challenge = new Challenge({
      ...req.body,
      tracks: tracks,
      users: users,
    });
    await challenge.save();
    const saved_challenge = await Challenge.findOne({
      id: challenge.id,
    });
    // Adds the user database id to the other schemas
    if (saved_challenge) {
      await addIdToUsers(saved_challenge._id, saved_challenge.users);
    }

    await challenge.populate({
      path: "tracks",
      select: ["id", "name"],
    });
    await challenge.populate({
      path: "users",
      select: ["id", "name"],
    });
    return res.status(201).send(challenge);
  } catch (error) {
    return res.status(500).send(error);
  }
});

challengeRouter.get("/challenges", async (req, res) => {
  try {
    const filter = req.query.name ? { name: req.query.name } : {};

    const challenges = await Challenge.find(filter)
      .populate({
        path: "tracks",
        select: ["id", "name"],
      })
      .populate({
        path: "users",
        select: ["id", "name"],
      });

    if (challenges.length !== 0) {
      return res.send(challenges);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

challengeRouter.get("/challenges/:id", async (req, res) => {
  try {
    const filter = req.params.id ? { id: req.params.id } : {};

    const challenges = await Challenge.find(filter)
      .populate({
        path: "tracks",
        select: ["id", "name"],
      })
      .populate({
        path: "users",
        select: ["id", "name"],
      });

    if (challenges.length !== 0) {
      return res.send(challenges);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

async function checkTracks(body_tracks: number[]) {
  body_tracks = body_tracks.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  const tracks: TrackDocumentInterface[] = [];
  for (let index = 0; index < body_tracks.length; index++) {
    const track = await Track.findOne({
      id: body_tracks[index],
    });
    if (!track) {
      throw new Error(`La ruta ${index} del reto introducido no existe`);
    } else {
      tracks.push(track._id);
    }
  }
  return tracks;
}

async function checkUsers(body_users: string[]) {
  body_users = body_users.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  const users: UserDocumentInterface[] = [];
  for (let index = 0; index < body_users.length; index++) {
    const user = await User.findOne({
      id: body_users[index],
    });
    if (!user) {
      throw new Error(`El usuario ${index} del reto introducido no existe`);
    } else {
      users.push(user._id);
    }
  }
  return users;
}

async function addIdToUsers(
  challenge_id: ChallengeDocumentInterface,
  users: UserDocumentInterface[]
) {
  for (let index = 0; index < users.length; index++) {
    await User.updateOne(
      { _id: users[index] },
      {
        $addToSet: {
          active_challenges: challenge_id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }
}
