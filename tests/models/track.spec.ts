import request from "supertest";
import { app } from "../../src/app.js";

describe("Modelo Track", () => {
  it("Debe recibir un error porque el ID debe ser un entero mayor o igual a 0", async () => {
    await request(app)
      .post("/tracks")
      .send({
        id: -1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);

    await request(app)
      .post("/tracks")
      .send({
        id: 0.1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);
  });

  it("Debe recibir un error porque las coordenadas iniciales son incorrectas", async () => {
    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [-91, 80],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);

    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [91, 80],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);

    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, -181],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);

    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 181],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);
  });

  it("Debe recibir un error porque las coordenadas finales son incorrectas", async () => {
    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [-91, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);

    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [91, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);

    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, -181],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);

    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 181],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);
  });

  it("Debe recibir un error porque la longitud no puede ser negativa", async () => {
    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [801, 80],
        length: -1,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);
  });

  it("Debe recibir un error porque el desnivel no puede ser negativo", async () => {
    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [801, 80],
        length: 5,
        slope: -1,
        users: [],
        activity_type: "Correr",
        average_score: 10,
      })
      .expect(500);
  });

  it("Debe recibir un error porque la puntuacion media debe estar entre 0 y 10", async () => {
    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: -1,
      })
      .expect(500);

    await request(app)
      .post("/tracks")
      .send({
        id: 1,
        name: "Test Track",
        beginning_coords: [80, 80],
        ending_coords: [80, 80],
        length: 5,
        slope: 2,
        users: [],
        activity_type: "Correr",
        average_score: 11,
      })
      .expect(500);
  });
});
