import request from "supertest";
import { app } from "../../src/app.js";

describe("Modelo Group", () => {
  it("Debe recibir un error porque el ID debe ser un entero mayor o igual a 0", async () => {
    await request(app)
      .post("/groups")
      .send({
        id: -1,
        name: "Test Group",
        participants: [],
        favourite_tracks: [],
        tracks_historical: [],
      })
      .expect(500);

    await request(app)
      .post("/groups")
      .send({
        id: 0.1,
        name: "Test Group",
        participants: [],
        favourite_tracks: [],
        tracks_historical: [],
      })
      .expect(500);
  });

  // Can't test group statistics because they're calculated automatically
});
