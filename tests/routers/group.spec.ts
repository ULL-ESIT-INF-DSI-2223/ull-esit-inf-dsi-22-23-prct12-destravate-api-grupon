import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import { Group } from "../../src/models/group.js";
import { Track } from "../../src/models/track.js";

const testGroup = {
  id: 1,
  name: "Test Group",
  participants: [],
  statistics: [
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  ranking: [],
  favourite_tracks: [],
  tracks_historical: [],
};

beforeEach(async () => {
  await Group.deleteMany();
  await new Group(testGroup).save();
  const savedGroup = await Group.findOne({ id: 1 });

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
  const savedTrack = await Track.findOne({ id: 1 });

  await User.deleteMany();
  await new User({
    id: "test",
    name: "Test User",
    activity_type: "Correr",
    friends: [],
    groups: [savedGroup!._id],
    statistics: [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    favourite_tracks: [savedTrack!._id],
    active_challenges: [],
    tracks_historical: [
      {
        date: "2023-05-12",
        track: savedTrack!._id,
      },
    ],
  }).save();
});

describe("POST /groups", () => {
  it("Debe crear un nuevo grupo", async () => {
    const savedTrack = await Track.findOne({ id: 1 });
    await new User({
      id: "othertest1",
      name: "Other Test User 1",
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
      tracks_historical: [
        {
          date: "2022-05-12",
          track: savedTrack!._id,
        },
        {
          date: "2018-03-01",
          track: savedTrack!._id,
        },
      ],
    }).save();

    await new User({
      id: "othertest2",
      name: "Other Test User 2",
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
    }).save();

    const response = await request(app)
      .post("/groups")
      .send({
        id: 2,
        name: "New Test Group",
        participants: ["test", "othertest1", "othertest2"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(201);

    expect(response.body).to.include({
      id: 2,
      name: "New Test Group",
    });

    const group = await Group.findById(response.body._id);
    expect(group).not.to.be.null;
    expect(group!.name).to.equal("New Test Group");
  });

  it("Debe recibir un error porque la ruta del historial no existe", async () => {
    await request(app)
      .post("/groups")
      .send({
        id: 2,
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 2,
          },
        ],
      })
      .expect(404);

    const group = await Group.findOne({ id: 2 });
    expect(group).to.be.null;
  });

  it("Debe recibir un error porque la ruta favorita no existe", async () => {
    await request(app)
      .post("/groups")
      .send({
        id: 2,
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [2],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(404);

    const group = await Group.findOne({ id: 2 });
    expect(group).to.be.null;
  });

  it("Debe recibir un error porque el usuario no existe", async () => {
    await request(app)
      .post("/groups")
      .send({
        id: 2,
        name: "New Test Group",
        participants: ["test2"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(404);

    const group = await Group.findOne({ id: 2 });
    expect(group).to.be.null;
  });

  it("Debe recibir un error porque el grupo ya existe", async () => {
    await request(app).post("/groups").send(testGroup).expect(500);
  });
});

describe("GET /groups", () => {
  it("Debe encontrar los grupos por su nombre", async () => {
    const response = await request(app)
      .get("/groups?name=Test Group")
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "Test Group",
    });
  });

  it("Debe fallar porque no existe un grupo con ese nombre", async () => {
    await request(app).get("/groups?name=False Test Group").expect(404);
  });

  // Can't generate a 500 status code artificially
});

describe("GET /groups/:id", () => {
  it("Debe encontrar el grupo por su ID", async () => {
    const response = await request(app).get("/groups/1").expect(200);

    expect(response.body).to.include({
      id: 1,
      name: "Test Group",
    });
  });

  it("Debe fallar porque no existe un grupo con ese ID", async () => {
    await request(app).get("/groups/2").expect(404);
  });

  it("Debe fallar porque el ID no puede ser una cadena", async () => {
    await request(app).get("/groups/test").expect(500);
  });
});

describe("PATCH /groups", () => {
  it("Debe actualizar los grupos por su nombre", async () => {
    const response = await request(app)
      .patch("/groups?name=Test Group")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2023-05-12",
            track: 1,
          },
        ],
      })
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "New Test Group",
    });

    const group = await Group.findById(response.body[0]._id);
    expect(group!.name).to.equal("New Test Group");
  });

  it("Debe recibir un error porque se debe proporcionar un nombre", async () => {
    const response = await request(app)
      .patch("/groups")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(400);

    expect(response.body).to.include({
      error: "Se debe proporcionar un nombre",
    });
  });

  it("Debe recibir un error porque es una actualización no permitida", async () => {
    const response = await request(app)
      .patch("/groups?name=Test Group")
      .send({
        id: 2,
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(400);

    expect(response.body).to.include({
      error: "Actualización no permitida",
    });
  });

  it("Debe recibir un error porque no hay grupos con ese nombre", async () => {
    await request(app)
      .patch("/groups?name=False Test Group")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(404);
  });

  it("Debe recibir un error porque la ruta del historial no existe", async () => {
    await request(app)
      .patch("/groups?name=Test Group")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 2,
          },
        ],
      })
      .expect(404);
  });

  it("Debe recibir un error porque la ruta favorita no existe", async () => {
    await request(app)
      .patch("/groups?name=Test Group")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [2],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el usuario no existe", async () => {
    await request(app)
      .patch("/groups?name=Test Group")
      .send({
        name: "New Test Group",
        participants: ["test2"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(404);
  });

  // Can't generate a 500 status code artificially
});

describe("PATCH /groups/:id", () => {
  it("Debe actualizar el grupo por su ID", async () => {
    const response = await request(app)
      .patch("/groups/1")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2023-05-12",
            track: 1,
          },
        ],
      })
      .expect(200);

    expect(response.body).to.include({
      id: 1,
      name: "New Test Group",
    });

    const group = await Group.findById(response.body._id);
    expect(group!.name).to.equal("New Test Group");
  });

  it("Debe recibir un error porque es una actualización no permitida", async () => {
    const response = await request(app)
      .patch("/groups/1")
      .send({
        id: 2,
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(400);

    expect(response.body).to.include({
      error: "Actualización no permitida",
    });
  });

  it("Debe recibir un error porque no hay grupos con ese ID", async () => {
    await request(app)
      .patch("/groups/2")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(404);
  });

  it("Debe recibir un error porque la ruta del historial no existe", async () => {
    await request(app)
      .patch("/groups/1")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 2,
          },
        ],
      })
      .expect(404);
  });

  it("Debe recibir un error porque la ruta favorita no existe", async () => {
    await request(app)
      .patch("/groups/1")
      .send({
        name: "New Test Group",
        participants: ["test"],
        favourite_tracks: [2],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el usuario no existe", async () => {
    await request(app)
      .patch("/groups/1")
      .send({
        name: "New Test Group",
        participants: ["test2"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el cuerpo está mal formado", async () => {
    await request(app)
      .patch("/groups/1")
      .send({
        name: ["New Test Group"],
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2022-01-01",
            track: 1,
          },
        ],
      })
      .expect(500);
  });
});

describe("DELETE /groups", () => {
  it("Debe borrar los grupos por su nombre", async () => {
    await request(app)
      .patch("/groups?name=Test Group")
      .send({
        name: "Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2023-05-12",
            track: 1,
          },
        ],
      });

    const response = await request(app)
      .delete("/groups?name=Test Group")
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "Test Group",
    });

    const group = await Group.findById(response.body[0]._id);
    expect(group).to.be.null;
  });

  it("Debe recibir un error porque se debe proporcionar un nombre", async () => {
    const response = await request(app).delete("/groups").expect(400);

    expect(response.body).to.include({
      error: "Se debe proporcionar un nombre",
    });
  });

  it("Debe recibir un error porque no hay grupos con ese nombre", async () => {
    await request(app).delete("/groups?name=False Test Group").expect(404);
  });

  // Can't generate a 500 status code artificially
});

describe("DELETE /groups/:id", () => {
  it("Debe borrar el grupo por su ID", async () => {
    await request(app)
      .patch("/groups/1")
      .send({
        name: "Test Group",
        participants: ["test"],
        favourite_tracks: [1],
        tracks_historical: [
          {
            date: "2023-05-12",
            track: 1,
          },
        ],
      });

    const response = await request(app).delete("/groups/1").expect(200);
    expect(response.body).to.include({
      id: 1,
      name: "Test Group",
    });

    const group = await Group.findById(response.body._id);
    expect(group).to.be.null;
  });

  it("Debe recibir un error porque no hay grupos con ese ID", async () => {
    await request(app).delete("/groups/2").expect(404);
  });

  it("Debe fallar porque el ID no puede ser una cadena", async () => {
    await request(app).delete("/groups/test").expect(500);
  });
});
