import express from "express";
import { Track, TrackDocumentInterface } from "../models/track.js";
import { User, UserDocumentInterface } from "../models/user.js";
import { Challenge, ChallengeDocumentInterface } from "../models/challenge.js";

export const challengeRouter = express.Router();

// Adds a challenge
challengeRouter.post("/challenges", async (req, res) => {
  try {
    // Checks if elements from body exist and get previous info
    let tracks: TrackDocumentInterface[] = [];
    let users: UserDocumentInterface[] = [];
    let length = 0;
    try {
      tracks = await getTracksMongoID(req.body.tracks);
      users = await getUsersMongoID(req.body.users);
      length = await calculateTotalLength(tracks);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Adds the challenge to the database
    const challenge = new Challenge({
      ...req.body,
      tracks: tracks,
      users: users,
      length: length,
    });
    await challenge.save();

    // Adds the challenge to the other collections
    await addChallengeToUsers(challenge);

    await challenge.populate({
      path: "tracks",
      select: ["id", "name"],
    });
    await challenge.populate({
      path: "users",
      select: ["id", "name"],
    });

    // Sends the result to the client
    return res.status(201).send(challenge);
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets challenges by name
challengeRouter.get("/challenges", async (req, res) => {
  try {
    // Gets challenges from the database
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

    // Sends the result to the client
    if (challenges.length !== 0) {
      return res.send(challenges);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets challenge by ID
challengeRouter.get("/challenges/:id", async (req, res) => {
  try {
    // Gets challenge from the database
    const filter = req.params.id ? { id: req.params.id } : {};
    const challenge = await Challenge.findOne(filter)
      .populate({
        path: "tracks",
        select: ["id", "name"],
      })
      .populate({
        path: "users",
        select: ["id", "name"],
      });

    // Sends the result to the client
    if (challenge) {
      return res.send(challenge);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates challenges by name
challengeRouter.patch("/challenges", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    // Checks if update is allowed
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

    // Checks if elements from body exist and get previous info
    let tracks: TrackDocumentInterface[] = [];
    let users: UserDocumentInterface[] = [];
    let length = 0;
    try {
      tracks = await getTracksMongoID(req.body.tracks);
      users = await getUsersMongoID(req.body.users);
      length = await calculateTotalLength(tracks);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Finds the challenges by name
    const challenges = await Challenge.find({
      name: req.query.name.toString(),
    });
    if (challenges.length !== 0) {
      const updatedChallenges: ChallengeDocumentInterface[] = [];
      for (let index = 0; index < challenges.length; index++) {
        // Updates a challenge
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

        // Updates the challenge information in the other collections
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
    // Sends the result to the client
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates challenge by ID
challengeRouter.patch("/challenges/:id", async (req, res) => {
  try {
    // Checks if update is allowed
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

    // Checks if elements from body exist and get previous info
    let tracks: TrackDocumentInterface[] = [];
    let users: UserDocumentInterface[] = [];
    let length = 0;
    try {
      tracks = await getTracksMongoID(req.body.tracks);
      users = await getUsersMongoID(req.body.users);
      length = await calculateTotalLength(tracks);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Updates the challenge
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

    // Updates the challenge information in the other collections
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

      // Sends the result to the client
      return res.send(updatedChallenges);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes challenges by name
challengeRouter.delete("/challenges", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    // Finds the challenges by name
    const challenges = await Challenge.find({
      name: req.query.name.toString(),
    });
    if (challenges.length !== 0) {
      for (let index = 0; index < challenges.length; index++) {
        // Deletes a challenge
        const deletedChallenge = await Challenge.findByIdAndDelete(
          challenges[index]._id
        );
        if (!deletedChallenge) return res.status(404).send();

        // Deletes the challenge information in the other collections
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
      // Sends the result to the client
      return res.send(challenges);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes challenge by ID
challengeRouter.delete("/challenges/:id", async (req, res) => {
  try {
    // Deletes the challenge
    const deletedChallenge = await Challenge.findOneAndDelete({
      id: req.params.id,
    });

    if (deletedChallenge) {
      // Deletes the challenge information in the other collections
      await deleteChallengeFromUsers(deletedChallenge);

      await deletedChallenge.populate({
        path: "tracks",
        select: ["id", "name"],
      });
      await deletedChallenge.populate({
        path: "users",
        select: ["id", "name"],
      });
      // Sends the result to the client
      return res.send(deletedChallenge);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * Checks if the tracks of the body exist and returns their Mongo ID
 * @param body_tracks IDs of the tracks to check
 * @returns Mongo ID of the tracks
 */
async function getTracksMongoID(body_tracks: number[]) {
  // Filters repeated IDs
  body_tracks = body_tracks.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  // Checks the IDs
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

/**
 * Checks if the users of the body exist and returns their Mongo ID
 * @param body_users IDs of the users to check
 * @returns Mongo ID of the users
 */
async function getUsersMongoID(body_users: string[]) {
  // Filters repeated IDs
  body_users = body_users.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  // Checks the IDs
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

/**
 * Sums the length of the tracks to get the total length
 * @param tracks Tracks of the challenge
 * @returns Total length of the challenge
 */
export async function calculateTotalLength(tracks: TrackDocumentInterface[]) {
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

/**
 * Adds the challenge info to all the users that are participating
 * @param challenge Challenge to add
 */
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
 * Deletes the challenge info from all the users that are participating
 * @param challenge Challenge to delete
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
