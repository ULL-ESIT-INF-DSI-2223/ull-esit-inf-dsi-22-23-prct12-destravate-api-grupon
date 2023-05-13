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

// Adds an user
userRouter.post("/users", async (req, res) => {
  try {
    // Checks if elements from body exist and get previous info
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
      friends = await getFriendsMongoID(req.body.friends);
      groups = await getGroupsMongoID(req.body.groups);
      favourite_tracks = await getFavouriteTracksMongoID(
        req.body.favourite_tracks
      );
      active_challenges = await getActiveChallengesMongoID(
        req.body.active_challenges
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

    // Adds the user to the other collections
    await addUserToFriends(user);
    await addUserToGroups(user);
    await addUserToActiveChallenges(user);
    await addUserToTracksInHistorical(user);

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

    // Sends the result to the client
    return res.status(201).send(user);
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets users by name
userRouter.get("/users", async (req, res) => {
  try {
    // Gets users from the database
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

    // Sends the result to the client
    if (users.length !== 0) {
      return res.send(users);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Gets user by ID
userRouter.get("/users/:id", async (req, res) => {
  try {
    // Gets user from the database
    const filter = req.params.id ? { id: req.params.id.toString() } : {};
    const user = await User.findOne(filter)
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

    // Sends the result to the client
    if (user) {
      return res.send(user);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates users by name
userRouter.patch("/users", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proporcionar un nombre",
      });
    }

    // Checks if update is allowed
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

    // Checks if elements from body exist and get previous info
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
      friends = await getFriendsMongoID(req.body.friends);
      groups = await getGroupsMongoID(req.body.groups);
      favourite_tracks = await getFavouriteTracksMongoID(
        req.body.favourite_tracks
      );
      active_challenges = await getActiveChallengesMongoID(
        req.body.active_challenges
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

    // Finds the users by name
    const users = await User.find({ name: req.query.name.toString() });
    if (users.length !== 0) {
      const updatedUsers: UserDocumentInterface[] = [];
      for (let index = 0; index < users.length; index++) {
        // Updates an user
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

        // Updates the user information in the other collections
        if (updatedUser) {
          await deleteUserFromFriends(userToUpdate);
          await deleteUserFromGroups(userToUpdate);
          await deleteUserFromActiveChallenges(userToUpdate);
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

      // Sends the result to the client
      return res.send(updatedUsers);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates user by ID
userRouter.patch("/users/:id", async (req, res) => {
  try {
    // Checks if update is allowed
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

    // Checks if elements from body exist and get previous info
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
      friends = await getFriendsMongoID(req.body.friends);
      groups = await getGroupsMongoID(req.body.groups);
      favourite_tracks = await getFavouriteTracksMongoID(
        req.body.favourite_tracks
      );
      active_challenges = await getActiveChallengesMongoID(
        req.body.active_challenges
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

    // Updates the user
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

    // Updates the user information in the other collections
    if (userToUpdate && updatedUser) {
      await deleteUserFromFriends(userToUpdate);
      await deleteUserFromGroups(userToUpdate);
      await deleteUserFromActiveChallenges(userToUpdate);
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

      // Sends the result to the client
      return res.send(updatedUser);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes users by name
userRouter.delete("/users", async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).send({
        error: "Se debe proveer el nombre de usuario",
      });
    }

    // Finds the users by name
    const users = await User.find({ name: req.query.name.toString() });
    if (users) {
      for (let i = 0; i < users.length; i++) {
        // Deletes an user
        const deletedUser = await User.findByIdAndDelete(users[i]._id);
        if (!deletedUser) return res.status(404).send();

        // Deletes the user information in the other collections
        await deleteUserFromFriends(deletedUser);
        await deleteUserFromGroups(deletedUser);
        await deleteUserFromActiveChallenges(deletedUser);
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
      // Sends the result to the client
      return res.send(users);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes user by ID
userRouter.delete("/users/:id", async (req, res) => {
  try {
    // Deletes the user
    const deletedUser = await User.findOneAndDelete({
      id: req.params.id.toString(),
    });

    if (deletedUser) {
      // Deletes the user information in the other collections
      await deleteUserFromFriends(deletedUser);
      await deleteUserFromGroups(deletedUser);
      await deleteUserFromActiveChallenges(deletedUser);
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
      // Sends the result to the client
      return res.send(deletedUser);
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

/**
 * Checks if the friends of the body exist and returns their Mongo ID
 * @param body_friends IDs of the friends to check
 * @returns Mongo ID of the friends
 */
async function getFriendsMongoID(body_friends: string[]) {
  // Filters repeated IDs
  body_friends = body_friends.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  // Checks the IDs
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
 * Checks if the groups of the body exist and returns their Mongo ID
 * @param body_groups IDs of the groups to check
 * @returns Mongo ID of the groups
 */
async function getGroupsMongoID(body_groups: number[]) {
  // Filters repeated IDs
  body_groups = body_groups.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
  // Checks the IDs
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
 * Checks if the favourite tracks of the body exist and returns their Mongo ID
 * @param body_favourite_tracks IDs of the favourite tracks to check
 * @returns Mongo ID of the favourite tracks
 */
async function getFavouriteTracksMongoID(body_favourite_tracks: number[]) {
  // Filters repeated IDs
  body_favourite_tracks = body_favourite_tracks.filter(function (
    elem,
    index,
    self
  ) {
    return index === self.indexOf(elem);
  });
  // Checks the IDs
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
 * Checks if the active challenges of the body exist and returns their Mongo ID
 * @param body_active_challenges IDs of the active challenges to check
 * @returns Mongo ID of the active challenges
 */
async function getActiveChallengesMongoID(body_active_challenges: number[]) {
  // Filters repeated IDs
  body_active_challenges = body_active_challenges.filter(function (
    elem,
    index,
    self
  ) {
    return index === self.indexOf(elem);
  });
  // Checks the IDs
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
 * Calculates the user statistics based on the historical
 * @param tracks_historical Tracks historical
 * @returns User statistics
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
 * Adds the user info to all its friends
 * @param user User to add
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
 * Adds the user info to all his groups
 * @param user User to add
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
 * Adds the user info to all his active challenges
 * @param user User to add
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
 * Adds the user info to all the tracks in his historical
 * @param user User to add
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
 * Deletes the user info from all his friends
 * @param user User to delete
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
 * Deletes the user info from all his groups
 * @param user User to delete
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
 * Deletes the user info from all his active challenges
 * @param user User to delete
 */
async function deleteUserFromActiveChallenges(user: UserDocumentInterface) {
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
 * Deletes the user info from all the tracks in his historical
 * @param user User to delete
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
