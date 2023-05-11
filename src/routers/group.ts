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
        error: error,
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

    const group_saved = await Group.findOne({
      id: group.id,
    });
    // Adds the user database id to the other schemas
    if (group_saved) {
      addIdToParticipants(group_saved._id, group_saved.participants);
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

async function checkParticipants(body_participants: string[]) {
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
  const ranking: UserDocumentInterface[] = [];
  for (let index = 0; index < body_ranking.length; index++) {
    const participant = await User.findOne({
      id: body_ranking[index],
    });
    if (!participant) {
      throw new Error(
        `El participante ${index} del ranking del grupo introducido no existe`
      );
    } else if (!participants.filter((element) => element.equals(participant))) {
      throw new Error(
        `El participante ${index} del ranking no pertenece al grupo`
      );
    } else {
      ranking.push(participant._id);
    }
  }
  return ranking;
}

async function checkFavouriteTracks(body_favourite_tracks: number[]) {
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
    const participant = await User.findById(participants[index]);
    if (participant) {
      await User.updateOne(
        { _id: participant._id },
        { groups: participant.groups.concat([group_id]) },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  }
}
