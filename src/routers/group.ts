import express from "express";
import { User, UserDocumentInterface } from "../models/user.js";
import { Track, TrackDocumentInterface } from "../models/track.js";
import {
  HistoricalElement,
  HistoricalElementDocumentInterface,
} from "../models/historical_element.js";
import { Group, GroupDocumentInterface } from "../models/group.js";

export const groupRouter = express.Router();

groupRouter.post("/groups", async (req, res) => {
  try {
    // Checks if elements from body exists in database
    let participants: UserDocumentInterface[] = [];
    let ranking: UserDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    try {
      participants = await checkParticipants(req.body.participants);
      ranking = await checkRanking(req.body.ranking, participants);
      favourite_tracks = await checkFavouriteTracks(req.body.favourite_tracks);
      tracks_historical = await checkTracksHistorical(
        req.body.tracks_historical
      );
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
    });
    await group.save();

    const saved_group = await Group.findOne({
      id: group.id,
    });
    // Adds the user database id to the other schemas
    if (saved_group) {
      await addIdToParticipants(saved_group._id, saved_group.participants);
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
    try {
      participants = await checkParticipants(req.body.participants);
      ranking = await checkRanking(req.body.ranking, participants);
      favourite_tracks = await checkFavouriteTracks(req.body.favourite_tracks);
      tracks_historical = await checkTracksHistorical(
        req.body.tracks_historical
      );
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const old_group = await Group.findOne({ name: req.query.name.toString() });
    const new_group = await Group.findOneAndUpdate(
      { name: req.query.name.toString() },
      {
        ...req.body,
        participants: participants,
        ranking: ranking,
        favourite_tracks: favourite_tracks,
        tracks_historical: tracks_historical,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (old_group && new_group) {
      //await deleteUserFromFriends(old_user, old_user.friends);
      //await deleteUserFromTrackRecord(old_user._id, old_user.tracks_historical);
      await addIdToParticipants(new_group._id, new_group.participants);

      await new_group.populate({
        path: "participants",
        select: ["id", "name"],
      });
      await new_group.populate({
        path: "ranking",
        select: ["id", "name"],
      });
      await new_group.populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      });
      await new_group.populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });
      return res.send(new_group);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

async function checkParticipants(body_participants: string[]) {
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

async function checkRanking(
  body_ranking: string[],
  participants: UserDocumentInterface[]
) {
  body_ranking = body_ranking.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  const ranking: UserDocumentInterface[] = [];
  for (let index = 0; index < body_ranking.length; index++) {
    const ranking_member = await User.findOne({
      id: body_ranking[index],
    });
    if (!ranking_member) {
      throw new Error(
        `El participante ${index} del ranking del grupo introducido no existe`
      );
    } else if (
      participants.filter((element) => element.equals(ranking_member._id))
        .length === 0
    ) {
      throw new Error(
        `El participante ${index} del ranking no se encontró en el grupo`
      );
    } else {
      ranking.push(ranking_member._id);
    }
  }
  return ranking;
}

async function checkFavouriteTracks(body_favourite_tracks: number[]) {
  body_favourite_tracks = body_favourite_tracks.filter(function (
    elem,
    index,
    self
  ) {
    return index === self.indexOf(elem);
  });
  const favourite_tracks: TrackDocumentInterface[] = [];
  for (let index = 0; index < body_favourite_tracks.length; index++) {
    const favourite_track = await Track.findOne({
      id: body_favourite_tracks[index],
    });
    if (!favourite_track) {
      throw new Error(
        `La ruta favorita ${index} del grupo introducido no existe`
      );
    } else {
      favourite_tracks.push(favourite_track._id);
    }
  }
  return favourite_tracks;
}

async function checkTracksHistorical(
  body_tracks_historical: HistoricalElementDocumentInterface[]
) {
  const tracks_historical: HistoricalElementDocumentInterface[] = [];
  for (let index = 0; index < body_tracks_historical.length; index++) {
    const historical_track = await Track.findOne({
      id: body_tracks_historical[index].track,
    });
    if (!historical_track) {
      throw new Error(
        `La ruta del histórico ${index} del grupo introducido no existe`
      );
    } else {
      tracks_historical.push(
        new HistoricalElement({
          date: body_tracks_historical[index].date,
          track: historical_track._id,
        })
      );
    }
  }
  return tracks_historical;
}

async function addIdToParticipants(
  group_id: GroupDocumentInterface,
  participants: UserDocumentInterface[]
) {
  for (let index = 0; index < participants.length; index++) {
    await User.updateOne(
      { _id: participants[index] },
      {
        $addToSet: {
          groups: group_id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }
}
