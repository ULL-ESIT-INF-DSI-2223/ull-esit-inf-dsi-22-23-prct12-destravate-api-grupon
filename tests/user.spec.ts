import request from "supertest";
import { expect } from "chai";
import { app } from "../src/app.js";
import { User } from "../src/models/user.js";

const firstUser = {
  id: "test1",
  name: "Test User Number 1",
  activity_type: "Correr",
  friends: [],
  groups: [],
  statistics: [
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  favourite_tracks: [],
  active_challenges: [],
  tracks_historical: [],
};

beforeEach(async () => {
  await User.deleteMany();
  await new User(firstUser).save();
});

describe("POST /users", () => {
  it("Should successfully create a new user", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        id: "test2",
        name: "Test User Number 2",
        activity_type: "Bicicleta",
        friends: [],
        groups: [],
        favourite_tracks: [],
        active_challenges: [],
        tracks_historical: [],
      })
      .expect(201);

    expect(response.body).to.include({
      id: "test2",
      name: "Test User Number 2",
      activity_type: "Bicicleta",
    });

    const secondUser = await User.findById(response.body._id);
    expect(secondUser).not.to.be.null;
    expect(secondUser!.name).to.equal("Test User Number 2");
  });

  it("Should get an error", async () => {
    await request(app).post("/users").send(firstUser).expect(500);
  });
});

describe("GET /users", () => {
  it("Should get a user by username", async () => {
    await request(app).get("/users?name=Test User Number 1").expect(200);
  });

  it("Should not find a user by username", async () => {
    await request(app).get("/users?name=False Test User").expect(404);
  });
});
