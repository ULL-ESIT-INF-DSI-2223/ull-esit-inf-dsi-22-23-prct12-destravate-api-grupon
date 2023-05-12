import express from "express";
import { User, UserDocumentInterface } from "../models/user.js";
import { Track, TrackDocumentInterface } from "../models/track.js";
import {
  HistoricalElement,
  HistoricalElementDocumentInterface,
} from "../models/historical_element.js";
import { Group, GroupDocumentInterface } from "../models/group.js";
import { calculateStatistics } from "./user.js";

export const groupRouter = express.Router();

groupRouter.post("/groups", async (req, res) => {
  try {
    // Checks if elements from body exists in database
    let participants: UserDocumentInterface[] = [];
    let ranking: UserDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    let statistics: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    try {
      participants = await getParticipantsDatabaseIDs(req.body.participants);
      ranking = await createRanking(participants);
      favourite_tracks = await getFavouriteTracksDatabaseIDs(
        req.body.favourite_tracks
      );
      tracks_historical = await checkTracksHistoricalDatabaseIDs(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }
    // Adds the user to the database
    const group = new Group({
      ...req.body,
      participants: participants,
      ranking: ranking,
      favourite_tracks: favourite_tracks,
      tracks_historical: tracks_historical,
      statistics: statistics,
    });
    await group.save();

    const savedGroup = await Group.findOne({
      id: group.id,
    });
    // Adds the user database id to the other schemas
    if (savedGroup) {
      await addGroupToParticipants(savedGroup);
    }

    await group.populate({
      path: "participants",
      select: ["id", "name"],
    });
    await group.populate({
      path: "ranking",
      select: ["id", "name"],
    });
    await group.populate({
      path: "favourite_tracks",
      select: ["id", "name"],
    });
    await group.populate({
      path: "tracks_historical.track",
      select: ["id", "name"],
    });
    return res.status(201).send(group);
  } catch (error) {
    return res.status(500).send(error);
  }
});

groupRouter.get("/groups", async (req, res) => {
  try {
    const filter = req.query.name ? { name: req.query.name } : {};

    const groups = await Group.find(filter)
      .populate({
        path: "participants",
        select: ["id", "name"],
      })
      .populate({
        path: "ranking",
        select: ["id", "name"],
      })
      .populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      })
      .populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });

    if (groups.length !== 0) {
      return res.send(groups);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

groupRouter.get("/groups/:id", async (req, res) => {
  try {
    const filter = req.params.id ? { id: req.params.id } : {};

    const groups = await Group.find(filter)
      .populate({
        path: "participants",
        select: ["id", "name"],
      })
      .populate({
        path: "ranking",
        select: ["id", "name"],
      })
      .populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      })
      .populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });

    if (groups.length !== 0) {
      return res.send(groups);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

groupRouter.patch("/groups", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    const allowedUpdates = [
      "name",
      "participants",
      "statistics",
      "ranking",
      "favourite_tracks",
      "tracks_historical",
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

    // Checks if elements from body exists in database
    let participants: UserDocumentInterface[] = [];
    let ranking: UserDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    let statistics: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    try {
      participants = await getParticipantsDatabaseIDs(req.body.participants);
      ranking = await createRanking(participants);
      favourite_tracks = await getFavouriteTracksDatabaseIDs(
        req.body.favourite_tracks
      );
      tracks_historical = await checkTracksHistoricalDatabaseIDs(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const groups = await Group.find({ name: req.query.name.toString() });
    if (groups.length !== 0) {
      const updatedGroups: GroupDocumentInterface[] = [];
      for (let index = 0; index < groups.length; index++) {
        const groupToUpdate = groups[index];
        const updatedGroup = await Group.findByIdAndUpdate(
          groupToUpdate._id,
          {
            ...req.body,
            participants: participants,
            ranking: ranking,
            favourite_tracks: favourite_tracks,
            tracks_historical: tracks_historical,
            statistics: statistics,
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (updatedGroup) {
          await deleteGroupFromParticipants(groupToUpdate);
          await addGroupToParticipants(updatedGroup);

          await updatedGroup.populate({
            path: "participants",
            select: ["id", "name"],
          });
          await updatedGroup.populate({
            path: "ranking",
            select: ["id", "name"],
          });
          await updatedGroup.populate({
            path: "favourite_tracks",
            select: ["id", "name"],
          });
          await updatedGroup.populate({
            path: "tracks_historical.track",
            select: ["id", "name"],
          });
          updatedGroups.push(updatedGroup);
        }
      }
      return res.send(updatedGroups);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

groupRouter.patch("/groups/:id", async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "participants",
      "statistics",
      "ranking",
      "favourite_tracks",
      "tracks_historical",
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

    // Checks if elements from body exists in database
    let participants: UserDocumentInterface[] = [];
    let ranking: UserDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    let statistics: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    try {
      participants = await getParticipantsDatabaseIDs(req.body.participants);
      ranking = await createRanking(participants);
      favourite_tracks = await getFavouriteTracksDatabaseIDs(
        req.body.favourite_tracks
      );
      tracks_historical = await checkTracksHistoricalDatabaseIDs(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const groupToUpdate = await Group.findOne({ id: req.params.id });
    const updatedGroup = await Group.findOneAndUpdate(
      { id: req.params.id },
      {
        ...req.body,
        participants: participants,
        ranking: ranking,
        favourite_tracks: favourite_tracks,
        tracks_historical: tracks_historical,
        statistics: statistics,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (groupToUpdate && updatedGroup) {
      await deleteGroupFromParticipants(groupToUpdate);
      await addGroupToParticipants(updatedGroup);

      await updatedGroup.populate({
        path: "participants",
        select: ["id", "name"],
      });
      await updatedGroup.populate({
        path: "ranking",
        select: ["id", "name"],
      });
      await updatedGroup.populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      });
      await updatedGroup.populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });
      return res.send(updatedGroup);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

groupRouter.delete("/groups", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proveer el nombre del grupo",
      });
    }

    const groups = await Group.find({
      name: req.query.name.toString(),
    });
    if (groups) {
      for (let index = 0; index < groups.length; index++) {
        const deletedGroup = await Group.findByIdAndDelete(groups[index]._id);
        if (!deletedGroup) return res.status(404).send();

        await deleteGroupFromParticipants(deletedGroup);
        await groups[index].populate({
          path: "participants",
          select: ["id", "name"],
        });
        await groups[index].populate({
          path: "ranking",
          select: ["id", "name"],
        });
        await groups[index].populate({
          path: "favourite_tracks",
          select: ["id", "name"],
        });
        await groups[index].populate({
          path: "tracks_historical.track",
          select: ["id", "name"],
        });
      }
      return res.send(groups);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

groupRouter.delete("/groups/:id", async (req, res) => {
  try {
    const deletedGroup = await Group.findOneAndDelete({ id: req.params.id });

    if (deletedGroup) {
      await deleteGroupFromParticipants(deletedGroup);

      await deletedGroup.populate({
        path: "participants",
        select: ["id", "name"],
      });
      await deletedGroup.populate({
        path: "ranking",
        select: ["id", "name"],
      });
      await deletedGroup.populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      });
      await deletedGroup.populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });
      return res.send(deletedGroup);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

async function getParticipantsDatabaseIDs(body_participants: string[]) {
  body_participants = body_participants.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  const participants: UserDocumentInterface[] = [];
  for (let index = 0; index < body_participants.length; index++) {
    const participant = await User.findOne({
      id: body_participants[index],
    });
    if (!participant) {
      throw new Error(
        `El participante ${index} del grupo introducido no existe`
      );
    } else {
      participants.push(participant._id);
    }
  }
  return participants;
}

async function createRanking(participants: UserDocumentInterface[]) {
  let ranking_data: [UserDocumentInterface, number][] = [];
  for (let i = 0; i < participants.length; i++) {
    const participant = await User.findById(participants[i]._id);
    let total_length = 0;
    if (participant) {
      for (let j = 0; j < participant.tracks_historical.length; j++) {
        const track = await Track.findById(
          participant.tracks_historical[j].track
        );
        if (track) {
          total_length += track.length;
        }
      }
      ranking_data.push([participant._id, total_length]);
    }
  }
  ranking_data = ranking_data.sort((element1, element2) => {
    if (element1[1] > element2[1]) {
      return -1;
    }
    if (element1[1] < element2[1]) {
      return 1;
    }
    return 0;
  });
  const ranking: UserDocumentInterface[] = [];
  ranking_data.forEach((element) => {
    ranking.push(element[0]);
  });
  return ranking;
}

async function getFavouriteTracksDatabaseIDs(body_favourite_tracks: number[]) {
  body_favourite_tracks = body_favourite_tracks.filter(function (
    elem,
    index,
    self
  ) {
    return index === self.indexOf(elem);
  });
  const favouriteTracks: TrackDocumentInterface[] = [];
  for (let index = 0; index < body_favourite_tracks.length; index++) {
    const favouriteTrack = await Track.findOne({
      id: body_favourite_tracks[index],
    });
    if (!favouriteTrack) {
      throw new Error(
        `La ruta favorita ${index} del grupo introducido no existe`
      );
    } else {
      favouriteTracks.push(favouriteTrack._id);
    }
  }
  return favouriteTracks;
}

async function checkTracksHistoricalDatabaseIDs(
  body_tracks_historical: HistoricalElementDocumentInterface[]
) {
  const tracksHistorical: HistoricalElementDocumentInterface[] = [];
  for (let index = 0; index < body_tracks_historical.length; index++) {
    const historicalTrack = await Track.findOne({
      id: body_tracks_historical[index].track,
    });
    if (!historicalTrack) {
      throw new Error(
        `La ruta del histórico ${index} del grupo introducido no existe`
      );
    } else {
      tracksHistorical.push(
        new HistoricalElement({
          date: body_tracks_historical[index].date,
          track: historicalTrack._id,
        })
      );
    }
  }
  return tracksHistorical;
}

async function addGroupToParticipants(group: GroupDocumentInterface) {
  for (let index = 0; index < group.participants.length; index++) {
    await User.updateOne(
      { _id: group.participants[index] },
      {
        $addToSet: {
          groups: group._id,
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
async function deleteGroupFromParticipants(group: GroupDocumentInterface) {
  for (let i = 0; i < group.participants.length; i++) {
    await User.updateOne(
      { _id: group.participants[i] },
      {
        $pull: {
          groups: group._id,
        },
      }
    );
  }
}
