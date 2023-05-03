import express from "express";
import "./db/mongoose.js";
import { trackRouter } from "./routers/track.js";
import { defaultRouter } from "./routers/default.js";

const app = express();
app.use(express.json());
app.use(trackRouter);
app.use(defaultRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
