import express from "express";
import { Track, TrackDocumentInterface } from "../models/track.js";
import { User, UserDocumentInterface } from "../models/user.js";
import { Group } from "../models/group.js";
import { Challenge } from "../models/challenge.js";
import { HistoricalElementDocumentInterface } from "../models/historical_element.js";
import { calculateStatistics } from "./user.js";

export const trackRouter = express.Router();

trackRouter.post("/tracks", async (req, res) => {
  try {
    // Checks if elements from body exists in database
    let users: UserDocumentInterface[] = [];
    try {
      users = await getUsersDatabaseIDs(req.body.users);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
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

    let users: UserDocumentInterface[] = [];
    try {
      users = await getUsersDatabaseIDs(req.body.users);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

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

        if (updatedTrack) {
          await deleteTrackFromUsers(trackToUpdate);
          await deleteTrackFromGroups(trackToUpdate);
          await deleteTrackFromChallenges(trackToUpdate);

          await updatedTrack.populate({
            path: "users",
            select: ["id", "name"],
          });
          updatedTracks.push(updatedTrack);
        }
      }
      return res.send(updatedTracks);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

trackRouter.patch("/tracks/:id", async (req, res) => {
  try {
    let users: UserDocumentInterface[] = [];
    try {
      users = await getUsersDatabaseIDs(req.body.users);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
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
    const trackToUpdate = await Track.findOne({ id: req.params.id });
    const updatedTrack = await Track.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, users: users },
      {
        new: true,
        runValidators: true,
      }
    );

    if (trackToUpdate && updatedTrack) {
      await deleteTrackFromUsers(trackToUpdate);
      await deleteTrackFromGroups(trackToUpdate);
      await deleteTrackFromChallenges(trackToUpdate);

      await updatedTrack.populate({
        path: "users",
        select: ["id", "name"],
      });
      return res.send(updatedTrack);
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
    }
    // If track exist we proceed if not sent not found
    const track = await Track.find({ name: req.query.name.toString() });
    if (track) {
      for (let index = 0; index < track.length; index++) {
        const deletedTrack = await Track.findByIdAndDelete(track[index]._id);
        if (!deletedTrack) return res.status(404).send();

        await deleteTrackFromUsers(deletedTrack);
        await deleteTrackFromGroups(deletedTrack);
        await deleteTrackFromChallenges(deletedTrack);
        await track[index].populate({
          path: "users",
          select: ["id", "name"],
        });
      }
      return res.send(track);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

trackRouter.delete("/tracks/:id", async (req, res) => {
  try {
    // If track exist we proceed if not sent not found
    const track = await Track.findOneAndDelete({ id: req.params.id });
    if (track) {
      await deleteTrackFromUsers(track);
      await deleteTrackFromGroups(track);
      await deleteTrackFromChallenges(track);
      await track.populate({
        path: "users",
        select: ["id", "name"],
      });
      return res.send(track);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * Function that given a posible list of groups of a user, checks if all exists
 *
 */
async function getUsersDatabaseIDs(body_users: number[]) {
  body_users = body_users.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
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
 * Function that given a track, deletes all info from users
 *
 */

async function deleteTrackFromUsers(track: TrackDocumentInterface) {
  const userList = await User.find();
  for (let i = 0; i < userList.length; i++) {
    await User.updateOne(
      { _id: userList[i] },
      {
        $pull: {
          favourite_tracks: track._id,
        },
      }
    );

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
 * Function that given a track, deletes all info from groups
 *
 */
async function deleteTrackFromGroups(track: TrackDocumentInterface) {
  const groupList = await Group.find();
  for (let i = 0; i < groupList.length; i++) {
    await Group.updateOne(
      { _id: groupList[i] },
      {
        $pull: {
          favourite_tracks: track._id,
        },
      }
    );

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
 * Function that given a track, deletes all info from groups
 *
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
