import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import { Group } from "../../src/models/group.js";
import { Challenge } from "../../src/models/challenge.js";
import { Track } from "../../src/models/track.js";

const testTrack = {
  id: 1,
  name: "Test Track",
  beginning_coords: [50, 10],
  ending_coords: [30, 20],
  length: 6,
  slope: 1,
  users: [],
  activity_type: "Correr",
  average_score: 8.5,
};

const otherTestTrack = {
  id: 10,
  name: "Other Test Track",
  beginning_coords: [40, 10],
  ending_coords: [30, 15],
  length: 2,
  slope: 6,
  users: [],
  activity_type: "Correr",
  average_score: 3.5,
};

beforeEach(async () => {
  await Track.deleteMany();
  await new Track(testTrack).save();
  const savedTrack = await Track.findOne({ id: 1 });
  await new Track(otherTestTrack).save();
  const otherSavedTrack = await Track.findOne({ id: 10 });

  await User.deleteMany();
  await new User({
    id: "test",
    name: "Test User",
    activity_type: "Correr",
    friends: [],
    groups: [],
    statistics: [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    favourite_tracks: [savedTrack!._id],
    active_challenges: [],
    tracks_historical: [
      {
        date: "2022-12-05",
        track: savedTrack!._id,
      },
    ],
  }).save();

  await Challenge.deleteMany();
  await new Challenge({
    id: 1,
    name: "Test Challenge",
    tracks: [savedTrack!._id],
    length: 6,
    activity_type: "Correr",
    users: [],
  }).save();

  await Group.deleteMany();
  await new Group({
    id: 1,
    name: "Test Group",
    participants: [],
    statistics: [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    ranking: [],
    favourite_tracks: [savedTrack!._id],
    tracks_historical: [
      {
        date: "2022-12-05",
        track: savedTrack!._id,
      },
      {
        date: "2022-11-05",
        track: otherSavedTrack!._id,
      },
    ],
  }).save();
});

describe("POST /tracks", () => {
  it("Debe crear una nueva ruta", async () => {
    const response = await request(app)
      .post("/tracks")
      .send({
        id: 2,
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 10,
      })
      .expect(201);

    expect(response.body).to.include({
      id: 2,
      name: "New Test Track",
      length: 5,
      slope: 2,
      activity_type: "Bicicleta",
      average_score: 10,
    });

    const track = await Track.findById(response.body._id);
    expect(track).not.to.be.null;
    expect(track!.name).to.equal("New Test Track");
  });

  it("Debe recibir un error porque el usuario no existe", async () => {
    await request(app)
      .post("/tracks")
      .send({
        id: 2,
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: ["test2"],
        activity_type: "Bicicleta",
        average_score: 10,
      })
      .expect(404);

    const track = await Track.findOne({ id: 2 });
    expect(track).to.be.null;
  });

  it("Debe recibir un error porque la ruta ya existe", async () => {
    await request(app).post("/tracks").send(testTrack).expect(500);
  });
});

describe("GET /tracks", () => {
  it("Debe encontrar las ruta por su nombre", async () => {
    const response = await request(app)
      .get("/tracks?name=Test Track")
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "Test Track",
      length: 6,
      slope: 1,
      activity_type: "Correr",
      average_score: 8.5,
    });
  });

  it("No debe encontrar las ruta por el nombre", async () => {
    await request(app).get("/tracks?name=False Test Track").expect(404);
  });

  // Can't generate a 500 status code artificially
});

describe("GET /tracks/:id", () => {
  it("Debe encontrar la ruta por su ID", async () => {
    const response = await request(app).get("/tracks/1").expect(200);

    expect(response.body).to.include({
      id: 1,
      name: "Test Track",
      length: 6,
      slope: 1,
      activity_type: "Correr",
      average_score: 8.5,
    });
  });

  it("No debe encontrar la ruta por el ID", async () => {
    await request(app).get("/tracks/2").expect(404);
  });

  it("Debe fallar porque el ID no puede ser una cadena", async () => {
    await request(app).get("/tracks/test").expect(500);
  });
});

describe("PATCH /tracks", () => {
  it("Debe actualizar las rutas por su nombre", async () => {
    const response = await request(app)
      .patch("/tracks?name=Test Track")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "New Test Track",
      length: 3,
      slope: 2,
      activity_type: "Bicicleta",
      average_score: 5,
    });

    const track = await Track.findById(response.body[0]._id);
    expect(track!.name).to.equal("New Test Track");
  });

  it("Debe recibir un error porque se debe proporcionar un nombre", async () => {
    const response = await request(app)
      .patch("/tracks")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(400);

    expect(response.body).to.include({
      error: "Se debe proporcionar un nombre",
    });
  });

  it("Debe recibir un error porque es una actualización no permitida", async () => {
    const response = await request(app)
      .patch("/tracks?name=Test Track")
      .send({
        id: 1,
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(400);
    expect(response.body).to.include({
      error: "Actualización no permitida",
    });
  });

  it("Debe recibir un error porque no hay rutas con ese nombre", async () => {
    await request(app)
      .patch("/tracks?name=False Test Track")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(404);
  });

  it("Debe recibir un error porque el usuario de la ruta no existe", async () => {
    await request(app)
      .patch("/tracks?name=False Test Track")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test2"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(404);
  });

  it("Debe recibir un error porque el cuerpo está mal formado", async () => {
    await request(app)
      .patch("/tracks?name=Test Track")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: "Test",
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(500);
  });
});

describe("PATCH /tracks/:id", () => {
  it("Debe actualizar la ruta por su ID", async () => {
    const response = await request(app)
      .patch("/tracks/1")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(200);

    expect(response.body).to.include({
      id: 1,
      name: "New Test Track",
      length: 3,
      slope: 2,
      activity_type: "Bicicleta",
      average_score: 5,
    });

    const track = await Track.findById(response.body._id);
    expect(track!.name).to.equal("New Test Track");
  });

  it("Debe recibir un error porque es una actualización no permitida", async () => {
    const response = await request(app)
      .patch("/tracks/1")
      .send({
        id: 1,
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(400);
    expect(response.body).to.include({
      error: "Actualización no permitida",
    });
  });

  it("Debe recibir un error porque no hay rutas con ese ID", async () => {
    await request(app)
      .patch("/tracks/2")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(404);
  });

  it("Debe recibir un error porque el usuario de la ruta no existe", async () => {
    await request(app)
      .patch("/tracks/1")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 3,
        slope: 2,
        users: ["test2"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(404);
  });

  it("Debe recibir un error porque el cuerpo está mal formado", async () => {
    await request(app)
      .patch("/tracks/1")
      .send({
        name: "New Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: "Test",
        slope: 2,
        users: ["test"],
        activity_type: "Bicicleta",
        average_score: 5,
      })
      .expect(500);
  });
});

describe("DELETE /tracks", () => {
  it("Debe borrar las rutas por su nombre", async () => {
    const response = await request(app)
      .delete("/tracks?name=Test Track")
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "Test Track",
      length: 6,
      slope: 1,
      activity_type: "Correr",
      average_score: 8.5,
    });

    const track = await Track.findById(response.body[0]._id);
    expect(track).to.be.null;
  });

  it("Debe recibir un error porque se debe proporcionar un nombre", async () => {
    const response = await request(app).delete("/tracks").expect(400);

    expect(response.body).to.include({
      error: "Se debe proporcionar un nombre",
    });
  });

  it("Debe recibir un error porque no hay rutas con ese nombre", async () => {
    await request(app).delete("/tracks?name=False Test Track").expect(404);
  });

  // Can't generate a 500 status code artificially
});

describe("DELETE /tracks/:id", () => {
  it("Debe borrar la ruta por su ID", async () => {
    const response = await request(app).delete("/tracks/1").expect(200);
    expect(response.body).to.include({
      id: 1,
      name: "Test Track",
      length: 6,
      slope: 1,
      activity_type: "Correr",
      average_score: 8.5,
    });

    const track = await Track.findById(response.body._id);
    expect(track).to.be.null;
  });

  it("Debe recibir un error porque no hay rutas con ese ID", async () => {
    await request(app).delete("/tracks/2").expect(404);
  });

  it("Debe fallar porque el ID no puede ser una cadena", async () => {
    await request(app).delete("/tracks/test").expect(500);
  });
});
