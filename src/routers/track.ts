import express from "express";
import { Track, TrackDocumentInterface } from "../models/track.js";
import { User, UserDocumentInterface } from "../models/user.js";
import { Group } from "../models/group.js";
import { Challenge } from "../models/challenge.js";
import { HistoricalElementDocumentInterface } from "../models/historical_element.js";
import { calculateStatistics } from "./user.js";

export const trackRouter = express.Router();

// Adds a track
trackRouter.post("/tracks", async (req, res) => {
  try {
    // Checks if elements from body exist and get previous info
    let users: UserDocumentInterface[] = [];
    try {
      users = await getUsersMongoID(req.body.users);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Adds the track to the database
    const track = new Track({ ...req.body, users: users });
    await track.save();
    await track.populate({
      path: "users",
      select: ["id", "name"],
    });

    // Sends the result to the client
    return res.status(201).send(track);
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets tracks by name
trackRouter.get("/tracks", async (req, res) => {
  try {
    // Gets tracks from the database
    const filter = req.query.name ? { name: req.query.name } : {};
    const tracks = await Track.find(filter).populate({
      path: "users",
      select: ["id", "name"],
    });

    // Sends the result to the client
    if (tracks.length !== 0) {
      return res.send(tracks);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets track by ID
trackRouter.get("/tracks/:id", async (req, res) => {
  try {
    // Gets track from the database
    const filter = req.params.id ? { id: req.params.id } : {};
    const track = await Track.findOne(filter).populate({
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

// Updates tracks by name
trackRouter.patch("/tracks", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    // Checks if update is allowed
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

    // Checks if elements from body exist and get previous info
    let users: UserDocumentInterface[] = [];
    try {
      users = await getUsersMongoID(req.body.users);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Finds the tracks by name
    const tracks = await Track.find({ name: req.query.name.toString() });
    if (tracks.length !== 0) {
      const updatedTracks: TrackDocumentInterface[] = [];
      for (let index = 0; index < tracks.length; index++) {
        const trackToUpdate = tracks[index];
        const updatedTrack = await Track.findByIdAndUpdate(
          trackToUpdate._id,
          { ...req.body, users: users },
          {
            new: true,
            runValidators: true,
          }
        );

        // Updates the track information in the other collections
        if (updatedTrack) {
          await deleteTrackFromUsers(trackToUpdate);

          await updatedTrack.populate({
            path: "users",
            select: ["id", "name"],
          });
          updatedTracks.push(updatedTrack);
        }
      }
      return res.send(updatedTracks);
    }
    // Sends the result to the client
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates track by ID
trackRouter.patch("/tracks/:id", async (req, res) => {
  try {
    // Checks if update is allowed
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

    // Checks if elements from body exist and get previous info
    let users: UserDocumentInterface[] = [];
    try {
      users = await getUsersMongoID(req.body.users);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Updates the track
    const trackToUpdate = await Track.findOne({ id: req.params.id });
    const updatedTrack = await Track.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, users: users },
      {
        new: true,
        runValidators: true,
      }
    );

    // Updates the track information in the other collections
    if (trackToUpdate && updatedTrack) {
      await deleteTrackFromUsers(trackToUpdate);

      await updatedTrack.populate({
        path: "users",
        select: ["id", "name"],
      });
      return res.send(updatedTrack);
    }
    // Sends the result to the client
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes users by name
trackRouter.delete("/tracks", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }
    // Finds the tracks by name
    const tracks = await Track.find({ name: req.query.name.toString() });
    if (tracks) {
      // Deletes a track
      for (let index = 0; index < tracks.length; index++) {
        const deletedTrack = await Track.findByIdAndDelete(tracks[index]._id);
        if (!deletedTrack) return res.status(404).send();

        // Deletes the track information in the other collections
        await deleteTrackFromUsers(deletedTrack);
        await deleteTrackFromGroups(deletedTrack);
        await deleteTrackFromChallenges(deletedTrack);
        await tracks[index].populate({
          path: "users",
          select: ["id", "name"],
        });
      }
      // Sends the result to the client
      return res.send(tracks);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes track by ID
trackRouter.delete("/tracks/:id", async (req, res) => {
  try {
    // Deletes the track
    const track = await Track.findOneAndDelete({ id: req.params.id });

    if (track) {
      // Deletes the track information in the other collections
      await deleteTrackFromUsers(track);
      await deleteTrackFromGroups(track);
      await deleteTrackFromChallenges(track);

      await track.populate({
        path: "users",
        select: ["id", "name"],
      });
      // Sends the result to the client
      return res.send(track);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * Checks if the users of the body exist and returns their Mongo ID
 * @param body_users IDs of the users to check
 * @returns Mongo ID of the users
 */
async function getUsersMongoID(body_users: number[]) {
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
      throw new Error(`El usuario ${index} de la ruta introducida no existe`);
    } else {
      users.push(user._id);
    }
  }
  return users;
}

/**
 * Deletes the track info from all the users
 * @param track Track to delete
 */
async function deleteTrackFromUsers(track: TrackDocumentInterface) {
  const userList = await User.find();
  for (let i = 0; i < userList.length; i++) {
    // Deletes the track from the favourtie tracks
    await User.updateOne(
      { _id: userList[i] },
      {
        $pull: {
          favourite_tracks: track._id,
        },
      }
    );

    // Deletes the track from the historical and recalculates the statistics
    const userTracksHistorical: HistoricalElementDocumentInterface[] = [];
    for (let j = 0; j < userList[i].tracks_historical.length; j++) {
      if (!userList[i].tracks_historical[j].track.equals(track._id)) {
        userTracksHistorical.push(userList[i].tracks_historical[j]);
      }
    }
    const statistics: number[][] = await calculateStatistics(
      userTracksHistorical
    );
    await User.findByIdAndUpdate(
      userList[i]._id,
      { tracks_historical: userTracksHistorical, statistics: statistics },
      {
        new: true,
        runValidators: true,
      }
    );
  }
}

/**
 * Deletes the track info from all the groups
 * @param track Track to delete
 */
async function deleteTrackFromGroups(track: TrackDocumentInterface) {
  const groupList = await Group.find();
  for (let i = 0; i < groupList.length; i++) {
    // Deletes the track from the favourtie tracks
    await Group.updateOne(
      { _id: groupList[i] },
      {
        $pull: {
          favourite_tracks: track._id,
        },
      }
    );

    // Deletes the track from the historical and recalculates the statistics
    const groupTracksHistorical: HistoricalElementDocumentInterface[] = [];
    for (let j = 0; j < groupList[i].tracks_historical.length; j++) {
      if (!groupList[i].tracks_historical[j].track.equals(track._id)) {
        groupTracksHistorical.push(groupList[i].tracks_historical[j]);
      }
    }
    const statistics: number[][] = await calculateStatistics(
      groupTracksHistorical
    );
    await Group.findByIdAndUpdate(
      groupList[i]._id,
      { tracks_historical: groupTracksHistorical, statistics: statistics },
      {
        new: true,
        runValidators: true,
      }
    );
  }
}

/**
 * Deletes the track info from all the challenges
 * @param track Track to delete
 */
async function deleteTrackFromChallenges(track: TrackDocumentInterface) {
  const challengeList = await Challenge.find();
  for (let i = 0; i < challengeList.length; i++) {
    await Challenge.updateOne(
      { _id: challengeList[i] },
      {
        $pull: {
          tracks: track._id,
        },
      }
    );
  }
}
