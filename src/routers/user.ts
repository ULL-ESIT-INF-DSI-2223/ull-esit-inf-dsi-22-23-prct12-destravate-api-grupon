import express from "express";
import { User, UserDocumentInterface } from "../models/user.js";
import { Track, TrackDocumentInterface } from "../models/track.js";
import moment from "moment";

export const userRouter = express.Router();

userRouter.post("/users", async (req, res) => {
  try {
    // Check if friends exist
    const friends: UserDocumentInterface[] = [];
    for (let index = 0; index < req.body.friends.length; index++) {
      const friend = await User.findOne({
        id: req.body.friends[index],
      });
      if (!friend) {
        return res.status(404).send({
          error: `El amigo ${index} del usuario introducido no existe`,
        });
      } else {
        friends.push(friend._id);
      }
    }
    // Check if favourite tracks exist
    const favourite_tracks: TrackDocumentInterface[] = [];
    for (let index = 0; index < req.body.favourite_tracks.length; index++) {
      const favourite_track = await Track.findOne({
        id: req.body.favourite_tracks[index],
      });
      if (!favourite_track) {
        return res.status(404).send({
          error: `La ruta favorita ${index} del usuario introducido no existe`,
        });
      } else {
        favourite_tracks.push(favourite_track._id);
      }
    }
    // Check if historical tracks exist
    const tracks_historical: [Date, TrackDocumentInterface][] = [];
    for (let index = 0; index < req.body.tracks_historical.length; index++) {
      const historical_track = await Track.findOne({
        id: req.body.tracks_historical[index][1],
      });
      if (!historical_track) {
        return res.status(404).send({
          error: `La ruta del histórico ${index} del usuario introducido no existe`,
        });
      } else {
        console.log(historical_track);

        console.log(new Date(req.body.tracks_historical[index][0]));
        tracks_historical.push([
          new Date(req.body.tracks_historical[index][0]),
          historical_track._id,
        ]);
      }
    }

    // Adds the user to de database
    const user = new User({
      ...req.body,
      friends: friends,
      favourite_tracks: favourite_tracks,
      tracks_historical: tracks_historical,
    });
    await user.save();

    //
    const user_saved = await User.findOne({
      id: user.id,
    });
    if (user_saved) {
      // Adds the new user database ID to his friends
      for (let index = 0; index < user_saved.friends.length; index++) {
        const friend = await User.findById(user_saved.friends[index]);
        if (friend) {
          await User.updateOne(
            { _id: friend._id },
            { friends: friend.friends.concat([user_saved._id]) },
            {
              new: true,
              runValidators: true,
            }
          );
        }
      }
      // Adds the new user database ID to the tracks in his historical
      for (
        let index = 0;
        index < user_saved.tracks_historical.length;
        index++
      ) {
        console.log(user_saved.tracks_historical[index][1]);
        const historical_track = await Track.findById(
          user_saved.tracks_historical[index][1]
        );
        if (historical_track) {
          console.log(index);
          await Track.updateOne(
            { _id: historical_track._id },
            { users: historical_track.users.concat([user_saved._id]) },
            {
              new: true,
              runValidators: true,
            }
          );
        }
      }
    }
    await user.populate({
      path: "friends",
      select: ["id", "name"],
    });
    await user.populate({
      path: "favourite_tracks",
      select: ["id", "name"],
    });
    return res.status(201).send(user);
  } catch (error) {
    return res.status(500).send(error);
  }
});
