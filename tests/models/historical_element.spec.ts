import request from "supertest";
import { app } from "../../src/app.js";
import { Track } from "../../src/models/track.js";

beforeEach(async () => {
  await Track.deleteMany();
  await new Track({
    id: 1,
    name: "Test Track",
    beginning_coords: [50, 10],
    ending_coords: [30, 20],
    length: 6,
    slope: 1,
    users: [],
    activity_type: "Correr",
    average_score: 8.5,
  }).save();
});

describe("Modelo Historical Element", () => {
  it("Debe recibir un error porque una fecha del historial no puede ser futura", async () => {
    await request(app)
      .post("/groups")
      .send({
        id: -1,
        name: "Test Group",
        participants: [],
        favourite_tracks: [],
        tracks_historical: [
          {
            date: "2024-01-01",
            track: 1,
          },
        ],
      })
      .expect(500);
  });
});
