import express from "express";
import { User, UserDocumentInterface } from "../models/user.js";
import { Track, TrackDocumentInterface } from "../models/track.js";
import {
  HistoricalElement,
  HistoricalElementDocumentInterface,
} from "../models/historical_element.js";
import { Group, GroupDocumentInterface } from "../models/group.js";

export const groupRouter = express.Router();

// Adds a group
groupRouter.post("/groups", async (req, res) => {
  try {
    // Checks if elements from body exist and get previous info
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
      participants = await getParticipantsMongoID(req.body.participants);
      ranking = await createRanking(participants);
      favourite_tracks = await getFavouriteTracksMongoID(
        req.body.favourite_tracks
      );
      tracks_historical = await getTracksInHistoricalMongoID(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Adds the group to the database
    const group = new Group({
      ...req.body,
      participants: participants,
      ranking: ranking,
      favourite_tracks: favourite_tracks,
      tracks_historical: tracks_historical,
      statistics: statistics,
    });
    await group.save();

    // Adds the group to the other collections
    await addGroupToParticipants(group);

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

    // Sends the result to the client
    return res.status(201).send(group);
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets groups by name
groupRouter.get("/groups", async (req, res) => {
  try {
    // Gets groups from the database
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

    // Sends the result to the client
    if (groups.length !== 0) {
      return res.send(groups);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets group by ID
groupRouter.get("/groups/:id", async (req, res) => {
  try {
    // Gets group from the database
    const filter = req.params.id ? { id: req.params.id } : {};
    const group = await Group.findOne(filter)
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

    // Sends the result to the client
    if (group) {
      return res.send(group);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates groups by name
groupRouter.patch("/groups", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    // Checks if update is allowed
    const allowedUpdates = [
      "name",
      "participants",
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

    // Checks if elements from body exist and get previous info
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
      participants = await getParticipantsMongoID(req.body.participants);
      ranking = await createRanking(participants);
      favourite_tracks = await getFavouriteTracksMongoID(
        req.body.favourite_tracks
      );
      tracks_historical = await getTracksInHistoricalMongoID(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Finds the groups by name
    const groups = await Group.find({ name: req.query.name.toString() });
    if (groups.length !== 0) {
      const updatedGroups: GroupDocumentInterface[] = [];
      for (let index = 0; index < groups.length; index++) {
        // Updates a group
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

        // Updates the group information in the other collections
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
    // Sends the result to the client
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates group by ID
groupRouter.patch("/groups/:id", async (req, res) => {
  try {
    // Checks if update is allowed
    const allowedUpdates = [
      "name",
      "participants",
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

    // Checks if elements from body exist and get previous info
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
      participants = await getParticipantsMongoID(req.body.participants);
      ranking = await createRanking(participants);
      favourite_tracks = await getFavouriteTracksMongoID(
        req.body.favourite_tracks
      );
      tracks_historical = await getTracksInHistoricalMongoID(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    // Updates the group
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

    // Updates the group information in the other collections
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
    // Sends the result to the client
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes groups by name
groupRouter.delete("/groups", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    // Finds the groups by name
    const groups = await Group.find({
      name: req.query.name.toString(),
    });
    if (groups.length !== 0) {
      for (let index = 0; index < groups.length; index++) {
        // Deletes a group
        const deletedGroup = await Group.findByIdAndDelete(groups[index]._id);
        if (!deletedGroup) return res.status(404).send();

        // Deletes the group information in the other collections
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
      // Sends the result to the client
      return res.send(groups);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes group by ID
groupRouter.delete("/groups/:id", async (req, res) => {
  try {
    // Deletes the group
    const deletedGroup = await Group.findOneAndDelete({ id: req.params.id });

    if (deletedGroup) {
      // Deletes the group information in the other collections
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
    // Sends the result to the client
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * Checks if the participants of the body exist and returns their Mongo ID
 * @param body_participants IDs of the participants to check
 * @returns Mongo ID of the participants
 */
async function getParticipantsMongoID(body_participants: string[]) {
  // Filters repeated IDs
  body_participants = body_participants.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  // Checks the IDs
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

/**
 * Checks if the favourite tracks of the body exist and returns their Mongo ID
 * @param body_favourite_tracks IDs of the favourite tracks to check
 * @returns Mongo ID of the favourite tracks
 */
async function getFavouriteTracksMongoID(body_favourite_tracks: number[]) {
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

/**
 * Checks if the tracks in historical of the body exist and returns their Mongo ID
 * @param body_tracks_historical IDs of the tracks in historical to check
 * @returns Mongo ID of the tracks in historical
 */
async function getTracksInHistoricalMongoID(
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

/**
 * Creates the ranking of the participants based on the kilometers traveled
 * @param participants Participants of the group
 * @returns Sorted ranking from best to worst
 */
async function createRanking(participants: UserDocumentInterface[]) {
  // Fills ranking_data with the participants and their total kilometers
  let ranking_data: [UserDocumentInterface, number][] = [];
  for (let i = 0; i < participants.length; i++) {
    const participant = await User.findById(participants[i]._id);
    let total_kilometers = 0;
    if (participant) {
      for (let j = 0; j < participant.tracks_historical.length; j++) {
        const track = await Track.findById(
          participant.tracks_historical[j].track
        );
        if (track) {
          total_kilometers += track.length;
        }
      }
      ranking_data.push([participant._id, total_kilometers]);
    }
  }
  // Sorts ranking_data by total kilometers
  ranking_data = ranking_data.sort((element1, element2) => {
    if (element1[1] > element2[1]) {
      return -1;
    }
    if (element1[1] < element2[1]) {
      return 1;
    }
    return 0;
  });
  // Fills ranking with ranking_data sorted participants and returns it
  const ranking: UserDocumentInterface[] = [];
  ranking_data.forEach((element) => {
    ranking.push(element[0]);
  });
  return ranking;
}

/**
 * Calculates the group statistics based on the historical
 * @param tracks_historical Tracks historical
 * @returns Group tatistics
 */
export async function calculateStatistics(
  tracks_historical: HistoricalElementDocumentInterface[]
) {
  const statistics = [
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  for (let index = 0; index < tracks_historical.length; index++) {
    const historicalElement: HistoricalElementDocumentInterface =
      tracks_historical[index];
    const historicalTrack = await Track.findOne({
      _id: tracks_historical[index].track,
    });
    if (historicalTrack) {
      const oneYearAgo = new Date();
      oneYearAgo.setMonth(new Date().getMonth() - 12);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(new Date().getMonth() - 1);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(new Date().getDay() - 7);

      if (historicalElement.date >= oneWeekAgo) {
        statistics[0][0] += historicalTrack?.length;
        statistics[0][1] += historicalTrack.slope;
      }
      if (historicalElement.date >= oneMonthAgo) {
        statistics[1][0] += historicalTrack?.length;
        statistics[1][1] += historicalTrack.slope;
      }
      if (historicalElement.date >= oneYearAgo) {
        statistics[2][0] += historicalTrack?.length;
        statistics[2][1] += historicalTrack.slope;
      }
    }
  }
  return statistics;
}

/**
 * Adds the group info to all the participants
 * @param group Group to add
 */
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
 * Deletes the group info from all the participants
 * @param group Group to delete
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
