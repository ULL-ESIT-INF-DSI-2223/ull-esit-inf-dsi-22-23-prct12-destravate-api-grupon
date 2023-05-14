import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import { Challenge } from "../../src/models/challenge.js";
import { Track } from "../../src/models/track.js";

const testChallenge = {
  id: 1,
  name: "Test Challenge",
  tracks: [],
  length: 6,
  activity_type: "Correr",
  users: [],
};

beforeEach(async () => {
  await Challenge.deleteMany();
  await new Challenge(testChallenge).save();
  const savedChallenge = await Challenge.findOne({ id: 1 });

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
    favourite_tracks: [],
    active_challenges: [savedChallenge!._id],
    tracks_historical: [],
  }).save();

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

describe("POST /challenges", () => {
  it("Debe crear un nuevo reto", async () => {
    const response = await request(app)
      .post("/challenges")
      .send({
        id: 2,
        name: "New Test Challenge",
        tracks: [],
        activity_type: "Bicicleta",
        users: [],
      })
      .expect(201);

    expect(response.body).to.include({
      id: 2,
      name: "New Test Challenge",
      activity_type: "Bicicleta",
    });

    const challenge = await Challenge.findById(response.body._id);
    expect(challenge).not.to.be.null;
    expect(challenge!.name).to.equal("New Test Challenge");
  });

  it("Debe recibir un error porque la ruta no existe", async () => {
    await request(app)
      .post("/challenges")
      .send({
        id: 2,
        name: "New Test Challenge",
        tracks: [2],
        length: 10,
        activity_type: "Correr",
        users: ["test"],
      })
      .expect(404);

    const challenge = await Challenge.findOne({ id: 2 });
    expect(challenge).to.be.null;
  });

  it("Debe recibir un error porque el usuario no existe", async () => {
    await request(app)
      .post("/challenges")
      .send({
        id: 2,
        name: "New Test Challenge",
        tracks: [1],
        length: 10,
        activity_type: "Correr",
        users: ["test2"],
      })
      .expect(404);

    const challenge = await Challenge.findOne({ id: 2 });
    expect(challenge).to.be.null;
  });

  it("Debe recibir un error porque el reto ya existe", async () => {
    await request(app).post("/challenges").send(testChallenge).expect(500);
  });
});

describe("GET /challenges", () => {
  it("Debe encontrar los retos por su nombre", async () => {
    const response = await request(app)
      .get("/challenges?name=Test Challenge")
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "Test Challenge",
      activity_type: "Correr",
    });
  });

  it("Debe fallar porque no existe un reto con ese nombre", async () => {
    await request(app).get("/challenges?name=False Test Challenge").expect(404);
  });

  // Can't generate a 500 status code artificially
});

describe("GET /challenges/:id", () => {
  it("Debe encontrar el reto por su ID", async () => {
    const response = await request(app).get("/challenges/1").expect(200);

    expect(response.body).to.include({
      id: 1,
      name: "Test Challenge",
      activity_type: "Correr",
    });
  });

  it("Debe fallar porque no existe un reto con ese ID", async () => {
    await request(app).get("/challenges/2").expect(404);
  });

  it("Debe fallar porque el ID no puede ser una cadena", async () => {
    await request(app).get("/challenges/test").expect(500);
  });
});

describe("PATCH /challenges", () => {
  it("Debe actualizar los retos por su nombre", async () => {
    const response = await request(app)
      .patch("/challenges?name=Test Challenge")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "New Test Challenge",
      activity_type: "Bicicleta",
    });

    const challenge = await Challenge.findById(response.body[0]._id);
    expect(challenge!.name).to.equal("New Test Challenge");
  });

  it("Debe recibir un error porque se debe proporcionar un nombre", async () => {
    const response = await request(app)
      .patch("/challenges")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(400);

    expect(response.body).to.include({
      error: "Se debe proporcionar un nombre",
    });
  });

  it("Debe recibir un error porque es una actualización no permitida", async () => {
    const response = await request(app)
      .patch("/challenges?name=Test Challenge")
      .send({
        id: 2,
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(400);

    expect(response.body).to.include({
      error: "Actualización no permitida",
    });
  });

  it("Debe recibir un error porque no hay retos con ese nombre", async () => {
    await request(app)
      .patch("/challenges?name=False Test Challenge")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(404);
  });

  it("Debe recibir un error porque la ruta no existe", async () => {
    await request(app)
      .patch("/challenges?name=Test Challenge")
      .send({
        name: "New Test Challenge",
        tracks: [2],
        length: 10,
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el usuario no existe", async () => {
    await request(app)
      .patch("/challenges?name=Test Challenge")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        length: 10,
        activity_type: "Bicicleta",
        users: ["test2"],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el cuerpo está mal formado", async () => {
    await request(app)
      .patch("/challenges?name=Test Challenge")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Otro",
        users: ["test"],
      })
      .expect(500);
  });
});

describe("PATCH /challenges/:id", () => {
  it("Debe actualizar la ruta por su ID", async () => {
    const response = await request(app)
      .patch("/challenges/1")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(200);

    expect(response.body).to.include({
      id: 1,
      name: "New Test Challenge",
      activity_type: "Bicicleta",
    });

    const challenge = await Challenge.findById(response.body._id);
    expect(challenge!.name).to.equal("New Test Challenge");
  });

  it("Debe recibir un error porque es una actualización no permitida", async () => {
    const response = await request(app)
      .patch("/challenges/1")
      .send({
        id: 2,
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(400);

    expect(response.body).to.include({
      error: "Actualización no permitida",
    });
  });

  it("Debe recibir un error porque no hay retos con ese ID", async () => {
    await request(app)
      .patch("/challenges/2")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(404);
  });

  it("Debe recibir un error porque la ruta no existe", async () => {
    await request(app)
      .patch("/challenges/1")
      .send({
        name: "New Test Challenge",
        tracks: [2],
        length: 10,
        activity_type: "Bicicleta",
        users: ["test"],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el usuario no existe", async () => {
    await request(app)
      .patch("/challenges/1")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        length: 10,
        activity_type: "Bicicleta",
        users: ["test2"],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el cuerpo está mal formado", async () => {
    await request(app)
      .patch("/challenges/1")
      .send({
        name: "New Test Challenge",
        tracks: [1],
        activity_type: "Test",
        users: ["test"],
      })
      .expect(500);
  });
});

describe("DELETE /challenges", () => {
  it("Debe borrar los retos por su nombre", async () => {
    await request(app)
      .patch("/challenges?name=Test Challenge")
      .send({
        name: "Test Challenge",
        tracks: [1],
        activity_type: "Correr",
        users: ["test"],
      });

    const response = await request(app)
      .delete("/challenges?name=Test Challenge")
      .expect(200);

    expect(response.body[0]).to.include({
      id: 1,
      name: "Test Challenge",
      activity_type: "Correr",
    });

    const challenge = await Challenge.findById(response.body[0]._id);
    expect(challenge).to.be.null;
  });

  it("Debe recibir un error porque se debe proporcionar un nombre", async () => {
    const response = await request(app).delete("/challenges").expect(400);

    expect(response.body).to.include({
      error: "Se debe proporcionar un nombre",
    });
  });

  it("Debe recibir un error porque no hay retos con ese nombre", async () => {
    await request(app)
      .delete("/challenges?name=False Test Challenge")
      .expect(404);
  });

  // Can't generate a 500 status code artificially
});

describe("DELETE /challenges/:id", () => {
  it("Debe borrar el reto por su ID", async () => {
    await request(app)
      .patch("/challenges/1")
      .send({
        name: "Test Challenge",
        tracks: [1],
        activity_type: "Correr",
        users: ["test"],
      });

    const response = await request(app).delete("/challenges/1").expect(200);
    expect(response.body).to.include({
      id: 1,
      name: "Test Challenge",
      activity_type: "Correr",
    });

    const challenge = await Challenge.findById(response.body._id);
    expect(challenge).to.be.null;
  });

  it("Debe recibir un error porque no hay retos con ese ID", async () => {
    await request(app).delete("/challenges/2").expect(404);
  });

  it("Debe fallar porque el ID no puede ser una cadena", async () => {
    await request(app).delete("/challenges/test").expect(500);
  });
});
