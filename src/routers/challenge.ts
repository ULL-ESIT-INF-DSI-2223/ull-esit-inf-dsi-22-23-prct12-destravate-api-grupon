import express from "express";
import { Track, TrackDocumentInterface } from "../models/track.js";
import { User, UserDocumentInterface } from "../models/user.js";
import { Challenge, ChallengeDocumentInterface } from "../models/challenge.js";

export const challengeRouter = express.Router();

challengeRouter.post("/challenges", async (req, res) => {
  try {
    let tracks: TrackDocumentInterface[] = [];
    let users: UserDocumentInterface[] = [];
    let length = 0;
    try {
      tracks = await getTracksDatabaseIDs(req.body.tracks);
      users = await getUsersDatabaseIDs(req.body.users);
      length = await calculateTotalLength(tracks);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const challenge = new Challenge({
      ...req.body,
      tracks: tracks,
      users: users,
      length: length,
    });
    await challenge.save();
    const savedChallenge = await Challenge.findOne({
      id: challenge.id,
    });
    // Adds the user database id to the other schemas
    if (savedChallenge) {
      await addChallengeToUsers(savedChallenge);
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

challengeRouter.patch("/challenges", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    const allowedUpdates = [
      "name",
      "tracks",
      "activity_type",
      "length",
      "users",
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

    let tracks: TrackDocumentInterface[] = [];
    let users: UserDocumentInterface[] = [];
    let length = 0;
    try {
      tracks = await getTracksDatabaseIDs(req.body.tracks);
      users = await getUsersDatabaseIDs(req.body.users);
      length = await calculateTotalLength(tracks);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const challenges = await Challenge.find({
      name: req.query.name.toString(),
    });
    if (challenges.length !== 0) {
      const updatedChallenges: ChallengeDocumentInterface[] = [];
      for (let index = 0; index < challenges.length; index++) {
        const challengeToUpdate = challenges[index];
        const updatedChallenge = await Challenge.findByIdAndUpdate(
          challengeToUpdate._id,
          {
            ...req.body,
            tracks: tracks,
            users: users,
            length: length,
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (updatedChallenge) {
          await deleteChallengeFromUsers(challengeToUpdate);
          await addChallengeToUsers(updatedChallenge);

          await updatedChallenge.populate({
            path: "tracks",
            select: ["id", "name"],
          });
          await updatedChallenge.populate({
            path: "users",
            select: ["id", "name"],
          });
          updatedChallenges.push(updatedChallenge);
        }
      }
      return res.send(updatedChallenges);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

challengeRouter.patch("/challenges/:id", async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "tracks",
      "activity_type",
      "length",
      "users",
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

    let tracks: TrackDocumentInterface[] = [];
    let users: UserDocumentInterface[] = [];
    let length = 0;
    try {
      tracks = await getTracksDatabaseIDs(req.body.tracks);
      users = await getUsersDatabaseIDs(req.body.users);
      length = await calculateTotalLength(tracks);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const challengeToUpdate = await Challenge.findOne({ id: req.params.id });
    const updatedChallenges = await Challenge.findOneAndUpdate(
      { id: req.params.id },
      {
        ...req.body,
        tracks: tracks,
        users: users,
        length: length,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (challengeToUpdate && updatedChallenges) {
      await deleteChallengeFromUsers(challengeToUpdate);
      await addChallengeToUsers(updatedChallenges);

      await updatedChallenges.populate({
        path: "tracks",
        select: ["id", "name"],
      });
      await updatedChallenges.populate({
        path: "users",
        select: ["id", "name"],
      });
      return res.send(updatedChallenges);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

challengeRouter.delete("/challenges", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proveer el nombre del reto",
      });
    }

    const challenges = await Challenge.find({
      name: req.query.name.toString(),
    });
    if (challenges) {
      for (let index = 0; index < challenges.length; index++) {
        const deletedChallenge = await Challenge.findByIdAndDelete(
          challenges[index]._id
        );
        if (!deletedChallenge) return res.status(404).send();

        await deleteChallengeFromUsers(deletedChallenge);
        await challenges[index].populate({
          path: "tracks",
          select: ["id", "name"],
        });
        await challenges[index].populate({
          path: "users",
          select: ["id", "name"],
        });
      }
      return res.send(challenges);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

challengeRouter.delete("/challenges/:id", async (req, res) => {
  try {
    const deletedChallenge = await Challenge.findOneAndDelete({
      id: req.params.id,
    });

    if (deletedChallenge) {
      await deleteChallengeFromUsers(deletedChallenge);

      await deletedChallenge.populate({
        path: "tracks",
        select: ["id", "name"],
      });
      await deletedChallenge.populate({
        path: "users",
        select: ["id", "name"],
      });
      return res.send(deletedChallenge);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

async function getTracksDatabaseIDs(body_tracks: number[]) {
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

async function getUsersDatabaseIDs(body_users: string[]) {
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

async function calculateTotalLength(tracks: TrackDocumentInterface[]) {
  let length = 0;
  for (let index = 0; index < tracks.length; index++) {
    const track = await Track.findOne({
      _id: tracks[index],
    });
    if (track) {
      length += track.length;
    }
  }
  return length;
}

async function addChallengeToUsers(challenge: ChallengeDocumentInterface) {
  for (let index = 0; index < challenge.users.length; index++) {
    await User.updateOne(
      { _id: challenge.users[index] },
      {
        $addToSet: {
          active_challenges: challenge._id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }
}

/**
 * Function that given an user , it deletes de user info from all the challenges he is in
 *
 */
async function deleteChallengeFromUsers(challenge: ChallengeDocumentInterface) {
  for (let i = 0; i < challenge.users.length; i++) {
    await User.updateOne(
      { _id: challenge.users[i] },
      {
        $pull: {
          active_challenges: challenge._id,
        },
      }
    );
  }
}
