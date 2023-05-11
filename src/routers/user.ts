import express from "express";
import { User, UserDocumentInterface } from "../models/user.js";
import { Track, TrackDocumentInterface } from "../models/track.js";
import {
  HistoricalElement,
  HistoricalElementDocumentInterface,
} from "../models/historical_element.js";
import { Group, GroupDocumentInterface } from "../models/group.js";

export const userRouter = express.Router();

userRouter.post("/users", async (req, res) => {
  try {
    // Checks if elements from body exists in database
    let friends: UserDocumentInterface[] = [];
    let groups: GroupDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    try {
      friends = await checkFriends(req.body.friends);
      groups = await checkGroups(req.body.groups);
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
    const user = new User({
      ...req.body,
      friends: friends,
      groups: groups,
      favourite_tracks: favourite_tracks,
      tracks_historical: tracks_historical,
    });
    await user.save();

    const user_saved = await User.findOne({
      id: user.id,
    });
    // Adds the user database id to the other schemas
    if (user_saved) {
      addIdToFriends(user_saved._id, user_saved.friends);
      addIdToGroups(user_saved._id, user_saved.groups);
      addIdToTracksHistorical(user_saved._id, user_saved.tracks_historical);
    }

    await user.populate({
      path: "friends",
      select: ["id", "name"],
    });
    await user.populate({
      path: "groups",
      select: ["id", "name"],
    });
    await user.populate({
      path: "favourite_tracks",
      select: ["id", "name"],
    });
    await user.populate({
      path: "tracks_historical.track",
      select: ["id", "name"],
    });
    return res.status(201).send(user);
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.get("/users", async (req, res) => {
  try {
    const filter = req.query.name ? { name: req.query.name } : {};

    const users = await User.find(filter)
      .populate({
        path: "friends",
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

    if (users.length !== 0) {
      return res.send(users);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.get("/users/:id", async (req, res) => {
  try {
    const filter = req.params.id ? { id: req.params.id } : {};

    const users = await User.find(filter)
      .populate({
        path: "friends",
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

    if (users.length !== 0) {
      return res.send(users);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.patch("/users", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    const allowedUpdates = [
      "name",
      "activity_type",
      "friends",
      "groups",
      "statistics",
      "favourite_tracks",
      "active_challenges",
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
    let friends: UserDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    try {
      friends = await checkFriends(req.body.friends);
      favourite_tracks = await checkFavouriteTracks(req.body.favourite_tracks);
      tracks_historical = await checkTracksHistorical(
        req.body.tracks_historical
      );
    } catch (error) {
      return res.status(404).send({
        error: error,
      });
    }

    const old_user = await User.findOne({ name: req.query.name.toString() });
    const new_user = await User.findOneAndUpdate(
      { name: req.query.name.toString() },
      {
        ...req.body,
        friends: friends,
        favourite_tracks: favourite_tracks,
        tracks_historical: tracks_historical,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (old_user && new_user) {
      await deleteUserFromFriends(old_user, old_user.friends);
      await deleteUserFromTrackRecord(old_user._id, old_user.tracks_historical);
      await addIdToFriends(new_user._id, new_user.friends);
      await addIdToTracksHistorical(new_user._id, new_user.tracks_historical);

      await new_user.populate({
        path: "friends",
        select: ["id", "name"],
      });
      await new_user.populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      });
      await new_user.populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });
      return res.send(new_user);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.patch("/users/:id", async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "activity_type",
      "friends",
      "groups",
      "statistics",
      "favourite_tracks",
      "active_challenges",
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
    let friends: UserDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    try {
      friends = await checkFriends(req.body.friends);
      favourite_tracks = await checkFavouriteTracks(req.body.favourite_tracks);
      tracks_historical = await checkTracksHistorical(
        req.body.tracks_historical
      );
    } catch (error) {
      return res.status(404).send({
        error: error,
      });
    }

    const old_user = await User.findOne({ id: req.params.id });
    const new_user = await User.findOneAndUpdate(
      { id: req.params.id },
      {
        ...req.body,
        friends: friends,
        favourite_tracks: favourite_tracks,
        tracks_historical: tracks_historical,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (old_user && new_user) {
      await deleteUserFromFriends(old_user, old_user.friends);
      await deleteUserFromTrackRecord(old_user._id, old_user.tracks_historical);
      await addIdToFriends(new_user._id, new_user.friends);
      await addIdToTracksHistorical(new_user._id, new_user.tracks_historical);

      await new_user.populate({
        path: "friends",
        select: ["id", "name"],
      });
      await new_user.populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      });
      await new_user.populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });
      return res.send(new_user);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.delete("/users", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se deve proveer el nombre de usuario",
      });
    } else {
      try {
        const user = await deleteUser(undefined, req.query.name.toString());

        if (!user) {
          return res.status(404).send();
        } else {
          return res.send(user);
        }
      } catch (error) {
        return res.status(500).send(error);
      }
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.delete("/users/:id", async (req, res) => {
  try {
    const user = await deleteUser(req.params.id.toString());

    if (!user) {
      return res.status(404).send();
    } else {
      return res.send(user);
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});
/**
 * Function that returns a user if it was deleted
 * If user was not found it returns null
 *
 * @returns null or user
 */
async function deleteUser(userID?: string, userName?: string) {
  if (!userID && !userName) return null;
  const filter = userID ? { id: userID } : { name: userName };

  const user = await User.findOneAndDelete(filter);

  if (!user) {
    return null;
  }
  //Check and delete user from Track record

  await deleteUserFromTrackRecord(user, user.tracks_historical);

  //Check to friends and delete this user from their list

  deleteUserFromFriends(user, user.friends);

  await user.populate({
    path: "friends",
    select: ["id", "name"],
  });
  await user.populate({
    path: "favourite_tracks",
    select: ["id", "name"],
  });
  await user.populate({
    path: "tracks_historical.track",
    select: ["id", "name"],
  });
  return user;
}

async function checkFriends(body_friends: string[]) {
  const friends: UserDocumentInterface[] = [];
  for (let index = 0; index < body_friends.length; index++) {
    const friend = await User.findOne({
      id: body_friends[index],
    });
    if (!friend) {
      throw new Error(`El amigo ${index} del usuario introducido no existe`);
    } else {
      friends.push(friend._id);
    }
  }
  return friends;
}

async function checkGroups(body_groups: number[]) {
  const groups: GroupDocumentInterface[] = [];
  for (let index = 0; index < body_groups.length; index++) {
    const group = await Group.findOne({
      id: body_groups[index],
    });
    if (!group) {
      throw new Error(`El grupo ${index} del usuario introducido no existe`);
    } else {
      groups.push(group._id);
    }
  }
  return groups;
}

async function checkFavouriteTracks(body_favourite_tracks: number[]) {
  const favourite_tracks: TrackDocumentInterface[] = [];
  for (let index = 0; index < body_favourite_tracks.length; index++) {
    const favourite_track = await Track.findOne({
      id: body_favourite_tracks[index],
    });
    if (!favourite_track) {
      throw new Error(
        `La ruta favorita ${index} del usuario introducido no existe`
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
        `La ruta del histórico ${index} del usuario introducido no existe`
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

async function addIdToFriends(
  user_id: UserDocumentInterface,
  friends: UserDocumentInterface[]
) {
  for (let index = 0; index < friends.length; index++) {
    const friend = await User.findById(friends[index]);
    if (friend) {
      await User.updateOne(
        { _id: friend._id },
        { friends: friend.friends.concat([user_id]) },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  }
}

async function addIdToGroups(
  user_id: UserDocumentInterface,
  groups: GroupDocumentInterface[]
) {
  for (let index = 0; index < groups.length; index++) {
    const group = await Group.findById(groups[index]);
    if (group) {
      await Group.updateOne(
        { _id: group._id },
        { participants: group.participants.concat([user_id]) },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  }
}

async function addIdToTracksHistorical(
  user_id: UserDocumentInterface,
  tracks_historical: HistoricalElementDocumentInterface[]
) {
  for (let index = 0; index < tracks_historical.length; index++) {
    const historical_track = await Track.findById(
      tracks_historical[index].track
    );
    if (historical_track) {
      await Track.updateOne(
        { _id: historical_track._id },
        { users: historical_track.users.concat([user_id]) },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  }
}

/**
 * Funtion that given an user and a trackID, it deletes de user from the record of the track
 *
 */
async function deleteUserFromTrackRecord(
  user: UserDocumentInterface,
  user_historical: HistoricalElementDocumentInterface[]
) {
  for (let i = 0; i < user_historical.length; i++) {
    const track = await Track.findById(user_historical[i].track);
    const new__track_user_list: UserDocumentInterface[] = [];
    if (track !== null) {
      for (let i = 0; i < track.users.length; i++) {
        if (!track.users[i].equals(user._id)) {
          new__track_user_list.push(track.users[i]);
        }
      }
      await Track.findByIdAndUpdate(
        user_historical[i].track,
        { users: new__track_user_list },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  }
}

async function deleteUserFromFriends(
  user: UserDocumentInterface,
  friends: UserDocumentInterface[]
) {
  for (let i = 0; i < friends.length; i++) {
    const user_friend = await User.findById(friends[i]);
    const new_user_list: UserDocumentInterface[] = [];

    if (user_friend !== null) {
      for (let j = 0; j < user_friend.friends.length; j++) {
        if (!user_friend.friends[j].equals(user._id)) {
          new_user_list.push(user_friend.friends[j]);
        }
      }
      await User.findByIdAndUpdate(
        user_friend._id,
        { friends: new_user_list },
        {
          new: true,
          runValidators: true,
        }
      );
    }
  }
}
