import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import { Challenge } from "../../src/models/challenge.js";
import { getActiveChallengesMongoID } from "../../src/routers/user.js";
import { getFavouriteTracksMongoID } from "../../src/routers/user.js";
import { getGroupsMongoID } from "../../src/routers/user.js";
import { getFriendsMongoID } from "../../src/routers/user.js";

const TestUser = {
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
  active_challenges: [],
  tracks_historical: [],
};

beforeEach(async () => {
  await User.deleteMany();
  await new User(TestUser).save();
});

afterEach(async () => {
  await User.deleteMany();
});

describe("POST /users", () => {
  it("Debe crear correctamente el usuario", async () => {
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

  it("Debe recibir un error porque ya hay un usuario con ese ID", async () => {
    await request(app)
      .post("/users")
      .send({
        id: "test",
        name: "Test User Number 2",
        activity_type: "Bicicleta",
        friends: [],
        groups: [],
        favourite_tracks: [],
        active_challenges: [],
        tracks_historical: [],
      })
      .expect(500);
  });

  it("Debe recibir un error porque un amigo del usuario no existe", async () => {
    await request(app)
      .post("/users")
      .send({
        id: "test",
        name: "Test User Number 2",
        activity_type: "Bicicleta",
        friends: ["Not a real friend"],
        groups: [],
        favourite_tracks: [],
        active_challenges: [],
        tracks_historical: [],
      })
      .expect(404);
  });
});

describe("GET /users", () => {
  it("Debe encontrar el usuario por su nombre", async () => {
    const response = await request(app)
      .get("/users?name=Test User")
      .expect(200);

    expect(response.body[0]).to.include({
      id: "test",
      name: "Test User",
      activity_type: "Correr",
    });
  });

  it("No debe encontrar los usuarios por el nombre", async () => {
    await request(app).get("/users?name=False Test User").expect(404);
  });
});

describe("GET /users/:id", () => {
  it("Debe encontrar un usuario por su ID", async () => {
    const response = await request(app).get("/users/test").expect(200);

    expect(response.body).to.include({
      id: "test",
      name: "Test User",
      activity_type: "Correr",
    });
  });

  it("No debe encontrar un usuario por el ID no existe", async () => {
    await request(app).get("/users/test12312").expect(404);
  });
});

describe("PATCH /users", () => {
  it("Debe actualizar los usuarios por su nombre", async () => {
    const response = await request(app)
      .patch("/users?name=Test User")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
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
      })
      .expect(200);

    expect(response.body[0]).to.include({
      name: "Test User But Changed",
      activity_type: "Bicicleta",
    });

    const user = await User.findById(response.body[0]._id);
    expect(user!.name).to.equal("Test User But Changed");
  });

  it("Debe recibir un error porque se debe proporcionar un nombre", async () => {
    const response = await request(app)
      .patch("/users")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
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
      })
      .expect(400);

    expect(response.body).to.include({
      error: "Se debe proporcionar un nombre",
    });
  });

  it("Debe recibir un error porque es una actualización no permitida", async () => {
    const response = await request(app)
      .patch("/users?name=Test User")
      .send({
        id: "TTT",
        name: "Test User But Changed",
        activity_type: "Bicicleta",
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
      })
      .expect(400);
    expect(response.body).to.include({
      error: "Actualización no permitida",
    });
  });

  it("Debe recibir un error porque no hay usuarios con ese nombre", async () => {
    await request(app)
      .patch("/users?name=Not a Real User")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
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
      })
      .expect(404);
  });

  it("Debe recibir un error porque el grupo del usuario no existe", async () => {
    await request(app)
      .patch("/users?name=Test User")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
        friends: [],
        groups: [15],
        statistics: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        favourite_tracks: [],
        active_challenges: [],
        tracks_historical: [],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el cuerpo está mal formado", async () => {
    await request(app)
      .patch("/users?name=Test User")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
        friends: [],
        groups: [15],
        statistics: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        favourite_tracks: "sss",
        active_challenges: [],
        tracks_historical: [],
      })
      .expect(404);
  });
});

describe("PATCH /users/:id", () => {
  it("Debe actualizar el usuario por su ID", async () => {
    const response = await request(app)
      .patch("/users/test")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
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
      })
      .expect(200);

    expect(response.body).to.include({
      name: "Test User But Changed",
      activity_type: "Bicicleta",
    });

    const usu = await User.findById(response.body._id);
    expect(usu!.name).to.equal("Test User But Changed");
  });

  it("Debe recibir un error porque es una actualización no permitida", async () => {
    const response = await request(app)
      .patch("/users/test")
      .send({
        id: "TTT",
        name: "Test User But Changed",
        activity_type: "Bicicleta",
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
      })
      .expect(400);
    expect(response.body).to.include({
      error: "Actualización no permitida",
    });
  });

  it("Debe recibir un error porque no hay usuarios con ese ID", async () => {
    await request(app)
      .patch("/users/2222")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
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
      })
      .expect(404);
  });

  it("Debe recibir un error porque el grupo del usuario no existe", async () => {
    await request(app)
      .patch("/users/test")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
        friends: [],
        groups: [15],
        statistics: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        favourite_tracks: [],
        active_challenges: [],
        tracks_historical: [],
      })
      .expect(404);
  });

  it("Debe recibir un error porque el cuerpo está mal formado", async () => {
    await request(app)
      .patch("/users/test")
      .send({
        name: "Test User But Changed",
        activity_type: "Bicicleta",
        friends: [],
        groups: "jajaja",
        statistics: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        favourite_tracks: [],
        active_challenges: [],
        tracks_historical: [],
      })
      .expect(404);
  });
});

describe("DELETE /users", () => {
  it("Debe borrar las rutas por su nombre", async () => {
    const response = await request(app)
      .delete("/users?name=Test User")
      .expect(200);

    expect(response.body[0]).to.include({
      id: "test",
      name: "Test User",
      activity_type: "Correr",
    });

    const user = await User.findById(response.body[0]._id);
    expect(user).to.be.null;
  });

  it("Debe recibir un error porque se debe proporcionar un nombre", async () => {
    const response = await request(app).delete("/users").expect(400);

    expect(response.body).to.include({
      error: "Se debe proveer el nombre de usuario",
    });
  });

  it("Debe recibir un error porque no hay rutas con ese nombre", async () => {
    await request(app).delete("/users?name=Not A Valid User").expect(404);
  });

  // Can't generate a 500 status code artificially
});

describe("DELETE /users/:id", () => {
  it("Debe borrar la ruta por su ID", async () => {
    const response = await request(app).delete("/users/test").expect(200);
    expect(response.body).to.include({
      id: "test",
      name: "Test User",
      activity_type: "Correr",
    });

    const user = await User.findById(response.body._id);
    expect(user).to.be.null;
  });

  it("Debe recibir un error porque no hay rutas con ese ID", async () => {
    await request(app).delete("/users/22222").expect(404);
  });
});

describe("Funciom getActiveChallengesMongoID", () => {
  it("Debe eliminar IDs repetidos y comprobar que todos los id son válidos", async () => {
    const response = await request(app)
      .post("/challenges")
      .send({
        id: 101,
        name: "Just a new challenge for testing a ramdom function",
        tracks: [],
        activity_type: "Bicicleta",
        users: [],
      })
      .expect(201);
    if (response) {
      const list_not_duplicated_id = await getActiveChallengesMongoID([
        101, 101,
      ]);
      expect(list_not_duplicated_id.length).to.be.equal(1);
    } else {
      expect(true).to.be.false;
    }

    try {
      await getActiveChallengesMongoID([101, 101, 202]);
      expect.fail("Se esperaba que se lanzara un error");
    } catch (error) {
      expect(error.message).to.equal(
        "El reto activo 1 del usuario introducido no existe"
      );
    }
    request(app).delete("/challenges/101").send().expect(201);
  });
});

describe("Funciom getFavouriteTracksMongoID", () => {
  it("Debe eliminar IDs repetidos y comprobar que todos los id son válidos", async () => {
    const response = await request(app)
      .post("/tracks")
      .send({
        id: 201,
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
    if (response) {
      const list_not_duplicated_id = await getFavouriteTracksMongoID([
        201, 201,
      ]);
      expect(list_not_duplicated_id.length).to.be.equal(1);
    }
    try {
      await getFavouriteTracksMongoID([201, 201, 202]);
      expect.fail("Se esperaba que se lanzara un error");
    } catch (error) {
      expect(error.message).to.equal(
        "La ruta favorita 1 del usuario introducido no existe"
      );
    }
    await request(app).delete("/tracks/201").send().expect(200);
  });
});

describe("Funciom getGroupsMongoID", () => {
  it("Debe eliminar IDs repetidos y comprobar que todos los id son válidos", async () => {
    const response = await request(app)
      .post("/groups")
      .send({
        id: 696969,
        name: "Not a Suspisius Group at all",
        participants: [],
        statistics: [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        ranking: [],
        favourite_tracks: [],
        tracks_historical: [],
      })
      .expect(201);
    if (response) {
      const list_not_duplicated_id = await getGroupsMongoID([696969, 696969]);
      expect(list_not_duplicated_id.length).to.be.equal(1);
    }
    try {
      await getGroupsMongoID([696969, 696969, 101123]);
      expect.fail("Se esperaba que se lanzara un error");
    } catch (error) {
      expect(error.message).to.equal(
        "El grupo 1 del usuario introducido no existe"
      );
    }
    await request(app).delete("/groups/696969").send().expect(200);
  });
});

describe("Funciom getFriendsMongoID", () => {
  it("Debe eliminar IDs repetidos y comprobar que todos los id son válidos", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        id: "GigaNG",
        name: "Not a suspisius user",
        activity_type: "Bicicleta",
        friends: ["test"],
        groups: [],
        favourite_tracks: [],
        active_challenges: [],
        tracks_historical: [],
      })
      .expect(201);
    if (response) {
      const list_not_duplicated_id = await getFriendsMongoID(["test", "test"]);
      expect(list_not_duplicated_id.length).to.be.equal(1);
    }
    try {
      await getFriendsMongoID(["test", "test", "101123"]);
      expect.fail("Se esperaba que se lanzara un error");
    } catch (error) {
      expect(error.message).to.equal(
        "El amigo 1 del usuario introducido no existe"
      );
    }
    await request(app).delete("/users/GigaNG").send().expect(200);
  });
});
