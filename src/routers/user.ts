import express from "express";
import { User, UserDocumentInterface } from "../models/user.js";
import { Track, TrackDocumentInterface } from "../models/track.js";
import {
  HistoricalElement,
  HistoricalElementDocumentInterface,
} from "../models/historical_element.js";
import { Group, GroupDocumentInterface } from "../models/group.js";
import { Challenge, ChallengeDocumentInterface } from "../models/challenge.js";

export const userRouter = express.Router();

userRouter.post("/users", async (req, res) => {
  try {
    // Checks if elements from body exists in database
    let friends: UserDocumentInterface[] = [];
    let groups: GroupDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let active_challenges: ChallengeDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    let statistics: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    try {
      friends = await getFriendsDatabaseIDs(req.body.friends);
      groups = await getGroupsDatabaseIDs(req.body.groups);
      favourite_tracks = await getFavouriteTracksDatabaseIDs(
        req.body.favourite_tracks
      );
      active_challenges = await getActiveChallengesDatabaseIDs(
        req.body.active_challenges
      );
      tracks_historical = await getTracksInHistoricalDatabaseIDs(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }
    // Adds the user to the database
    const user = new User({
      ...req.body,
      friends: friends,
      groups: groups,
      favourite_tracks: favourite_tracks,
      active_challenges: active_challenges,
      tracks_historical: tracks_historical,
      statistics: statistics,
    });
    await user.save();

    const savedUser = await User.findOne({
      id: user.id,
    });
    // Adds the user database id to the other schemas
    if (savedUser) {
      await addUserToFriends(savedUser);
      await addUserToGroups(savedUser);
      await addUserToActiveChallenges(savedUser);
      await addUserToTracksInHistorical(savedUser);
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
      path: "active_challenges",
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
        path: "groups",
        select: ["id", "name"],
      })
      .populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      })
      .populate({
        path: "active_challenges",
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
    const filter = req.params.id ? { id: req.params.id.toString() } : {};

    const users = await User.find(filter)
      .populate({
        path: "friends",
        select: ["id", "name"],
      })
      .populate({
        path: "groups",
        select: ["id", "name"],
      })
      .populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      })
      .populate({
        path: "active_challenges",
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
    let groups: GroupDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let active_challenges: ChallengeDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    let statistics: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    try {
      friends = await getFriendsDatabaseIDs(req.body.friends);
      groups = await getGroupsDatabaseIDs(req.body.groups);
      favourite_tracks = await getFavouriteTracksDatabaseIDs(
        req.body.favourite_tracks
      );
      active_challenges = await getActiveChallengesDatabaseIDs(
        req.body.active_challenges
      );
      tracks_historical = await getTracksInHistoricalDatabaseIDs(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const users = await User.find({ name: req.query.name.toString() });
    if (users.length !== 0) {
      const updatedUsers: UserDocumentInterface[] = [];
      for (let index = 0; index < users.length; index++) {
        const userToUpdate = users[index];
        const updatedUser = await User.findByIdAndUpdate(
          userToUpdate._id,
          {
            ...req.body,
            friends: friends,
            groups: groups,
            favourite_tracks: favourite_tracks,
            active_challenges: active_challenges,
            tracks_historical: tracks_historical,
            statistics: statistics,
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (updatedUser) {
          await deleteUserFromFriends(userToUpdate);
          await deleteUserFromGroups(userToUpdate);
          await deleteUserFromChallenges(userToUpdate);
          await deleteUserFromTracksInHistorical(userToUpdate);
          await addUserToFriends(updatedUser);
          await addUserToGroups(updatedUser);
          await addUserToActiveChallenges(updatedUser);
          await addUserToTracksInHistorical(updatedUser);

          await updatedUser.populate({
            path: "friends",
            select: ["id", "name"],
          });
          await updatedUser.populate({
            path: "groups",
            select: ["id", "name"],
          });
          await updatedUser.populate({
            path: "favourite_tracks",
            select: ["id", "name"],
          });
          await updatedUser.populate({
            path: "active_challenges",
            select: ["id", "name"],
          });
          await updatedUser.populate({
            path: "tracks_historical.track",
            select: ["id", "name"],
          });
          updatedUsers.push(updatedUser);
        }
      }
      return res.send(updatedUsers);
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
    let groups: GroupDocumentInterface[] = [];
    let favourite_tracks: TrackDocumentInterface[] = [];
    let active_challenges: ChallengeDocumentInterface[] = [];
    let tracks_historical: HistoricalElementDocumentInterface[] = [];
    let statistics: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    try {
      friends = await getFriendsDatabaseIDs(req.body.friends);
      groups = await getGroupsDatabaseIDs(req.body.groups);
      favourite_tracks = await getFavouriteTracksDatabaseIDs(
        req.body.favourite_tracks
      );
      active_challenges = await getActiveChallengesDatabaseIDs(
        req.body.active_challenges
      );
      tracks_historical = await getTracksInHistoricalDatabaseIDs(
        req.body.tracks_historical
      );
      statistics = await calculateStatistics(tracks_historical);
    } catch (error) {
      return res.status(404).send({
        error: error.message,
      });
    }

    const userToUpdate = await User.findOne({ id: req.params.id.toString() });
    const updatedUser = await User.findOneAndUpdate(
      { id: req.params.id },
      {
        ...req.body,
        friends: friends,
        groups: groups,
        favourite_tracks: favourite_tracks,
        active_challenges: active_challenges,
        tracks_historical: tracks_historical,
        statistics: statistics,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (userToUpdate && updatedUser) {
      await deleteUserFromFriends(userToUpdate);
      await deleteUserFromGroups(userToUpdate);
      await deleteUserFromChallenges(userToUpdate);
      await deleteUserFromTracksInHistorical(userToUpdate);
      await addUserToFriends(updatedUser);
      await addUserToGroups(updatedUser);
      await addUserToActiveChallenges(updatedUser);
      await addUserToTracksInHistorical(updatedUser);

      await updatedUser.populate({
        path: "friends",
        select: ["id", "name"],
      });
      await updatedUser.populate({
        path: "groups",
        select: ["id", "name"],
      });
      await updatedUser.populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      });
      await updatedUser.populate({
        path: "active_challenges",
        select: ["id", "name"],
      });
      await updatedUser.populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });
      return res.send(updatedUser);
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
        error: "Se debe proveer el nombre de usuario",
      });
    } else {
      try {
        const users = await User.find({ name: req.query.name.toString() });
        if (users) {
          for (let i = 0; i < users.length; i++) {
            const deletedUser = await User.findByIdAndDelete(users[i]._id);
            if (!deletedUser) return res.status(404).send();

            await deleteUserFromFriends(deletedUser);
            //Check user groups and removes himself
            await deleteUserFromGroups(deletedUser);
            await deleteUserFromChallenges(deletedUser);
            //Check and delete user from Track record
            await deleteUserFromTracksInHistorical(deletedUser);
            await users[i].populate({
              path: "friends",
              select: ["id", "name"],
            });
            await users[i].populate({
              path: "groups",
              select: ["id", "name"],
            });
            await users[i].populate({
              path: "favourite_tracks",
              select: ["id", "name"],
            });
            await users[i].populate({
              path: "active_challenges",
              select: ["id", "name"],
            });
            await users[i].populate({
              path: "tracks_historical.track",
              select: ["id", "name"],
            });
          }
          return res.send(users);
        }
        return res.status(404).send();
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
    const deletedUser = await User.findOneAndDelete({
      id: req.params.id.toString(),
    });

    if (deletedUser) {
      await deleteUserFromFriends(deletedUser);

      //Check user groups and removes himself
      await deleteUserFromGroups(deletedUser);

      await deleteUserFromChallenges(deletedUser);

      //Check and delete user from Track record
      await deleteUserFromTracksInHistorical(deletedUser);

      await deletedUser.populate({
        path: "friends",
        select: ["id", "name"],
      });
      await deletedUser.populate({
        path: "groups",
        select: ["id", "name"],
      });
      await deletedUser.populate({
        path: "favourite_tracks",
        select: ["id", "name"],
      });
      await deletedUser.populate({
        path: "active_challenges",
        select: ["id", "name"],
      });
      await deletedUser.populate({
        path: "tracks_historical.track",
        select: ["id", "name"],
      });
      return res.send(deletedUser);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * Function that given a posible list of friends of a user, checks if all exists
 *
 */
async function getFriendsDatabaseIDs(body_friends: string[]) {
  body_friends = body_friends.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
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

/**
 * Function that given a posible list of groups of a user, checks if all exists
 *
 */
async function getGroupsDatabaseIDs(body_groups: number[]) {
  body_groups = body_groups.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
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

/**
 * Function that given a posible list of challenges of a user, checks if all exists
 *
 */
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
        `La ruta favorita ${index} del usuario introducido no existe`
      );
    } else {
      favouriteTracks.push(favouriteTrack._id);
    }
  }
  return favouriteTracks;
}

/**
 * Function that given a posible list of challenges of a user, checks if all exists
 *
 */
async function getActiveChallengesDatabaseIDs(
  body_active_challenges: number[]
) {
  body_active_challenges = body_active_challenges.filter(function (
    elem,
    index,
    self
  ) {
    return index === self.indexOf(elem);
  });
  const activeChallenges: ChallengeDocumentInterface[] = [];
  for (let index = 0; index < body_active_challenges.length; index++) {
    const activeChallenge = await Challenge.findOne({
      id: body_active_challenges[index],
    });
    if (!activeChallenge) {
      throw new Error(
        `El reto activo ${index} del usuario introducido no existe`
      );
    } else {
      activeChallenges.push(activeChallenge._id);
    }
  }
  return activeChallenges;
}

/**
 * Function that given a posible track historical of a user, checks if all traks exists
 *
 */
async function getTracksInHistoricalDatabaseIDs(
  body_tracks_historical: HistoricalElementDocumentInterface[]
) {
  const tracksHistorical: HistoricalElementDocumentInterface[] = [];
  for (let index = 0; index < body_tracks_historical.length; index++) {
    const historicalTrack = await Track.findOne({
      id: body_tracks_historical[index].track,
    });
    if (!historicalTrack) {
      throw new Error(
        `La ruta del histórico ${index} del usuario introducido no existe`
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
 * Function that given a posible track historical of a user, checks if all traks exists
 *
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
 * Function that given an user , it adds the info of the user to all his friends
 *
 */
async function addUserToFriends(user: UserDocumentInterface) {
  for (let index = 0; index < user.friends.length; index++) {
    await User.updateOne(
      { _id: user.friends[index] },
      {
        $addToSet: {
          friends: user._id,
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
 * Function that given an user , it adds the info of the user to all groups he is in
 *
 */
async function addUserToGroups(user: UserDocumentInterface) {
  for (let index = 0; index < user.groups.length; index++) {
    await Group.updateOne(
      { _id: user.groups[index] },
      {
        $addToSet: {
          participants: user._id,
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
 * Function that given an user , it adds the info of the user to all challenges he has participating
 *
 */
async function addUserToActiveChallenges(user: UserDocumentInterface) {
  for (let index = 0; index < user.active_challenges.length; index++) {
    await Challenge.updateOne(
      { _id: user.active_challenges[index] },
      {
        $addToSet: {
          users: user._id,
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
 * Function that given an user , it adds the info of the user to all tracks he has visited
 *
 */
async function addUserToTracksInHistorical(user: UserDocumentInterface) {
  for (let index = 0; index < user.tracks_historical.length; index++) {
    await Track.updateOne(
      { _id: user.tracks_historical[index].track },
      {
        $addToSet: {
          users: user._id,
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
async function deleteUserFromFriends(user: UserDocumentInterface) {
  for (let i = 0; i < user.friends.length; i++) {
    await User.updateOne(
      { _id: user.friends[i] },
      {
        $pull: {
          friends: user._id,
        },
      }
    );
  }
}

/**
 * Function that given an user , it deletes de user info from all the groups he is in
 *
 */

async function deleteUserFromGroups(user: UserDocumentInterface) {
  for (let i = 0; i < user.groups.length; i++) {
    await Group.updateOne(
      { _id: user.groups[i] },
      {
        $pull: {
          participants: user._id,
          ranking: user._id,
        },
      }
    );
  }
}

/**
 * Function that given an user , it deletes de user info from all the challenges he is in
 *
 */
async function deleteUserFromChallenges(user: UserDocumentInterface) {
  for (let i = 0; i < user.active_challenges.length; i++) {
    await Challenge.updateOne(
      { _id: user.active_challenges[i] },
      {
        $pull: {
          users: user._id,
        },
      }
    );
  }
}

/**
 * Function that given an user , it deletes de user info from all the tracks in his historical
 *
 */
async function deleteUserFromTracksInHistorical(user: UserDocumentInterface) {
  for (let i = 0; i < user.tracks_historical.length; i++) {
    await Track.updateOne(
      { _id: user.tracks_historical[i].track._id },
      {
        $pull: {
          users: user._id,
        },
      }
    );
  }
}
