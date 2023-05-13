import express from "express";
import "./db/mongoose.js";
import { trackRouter } from "./routers/track.js";
import { userRouter } from "./routers/user.js";
import { groupRouter } from "./routers/group.js";
import { challengeRouter } from "./routers/challenge.js";
import { defaultRouter } from "./routers/default.js";

export const app = express();

app.use(express.json());
app.use(trackRouter);
app.use(userRouter);
app.use(groupRouter);
app.use(challengeRouter);
app.use(defaultRouter);
