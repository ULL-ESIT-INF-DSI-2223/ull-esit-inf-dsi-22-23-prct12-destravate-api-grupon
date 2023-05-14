import request from "supertest";
import { app } from "../../src/app.js";

describe("Modelo Challenge", () => {
  it("Debe recibir un error porque el ID debe ser un entero mayor o igual a 0", async () => {
    await request(app)
      .post("/challenges")
      .send({
        id: -1,
        name: "w Test Challenge",
        tracks: [],
        activity_type: "Correr",
        users: [],
      })
      .expect(500);

    await request(app)
      .post("/challenges")
      .send({
        id: 0.1,
        name: "Test Challenge",
        tracks: [],
        activity_type: "Correr",
        users: [],
      })
      .expect(500);
  });

  // Can't test length because it's calculated automatically
});
