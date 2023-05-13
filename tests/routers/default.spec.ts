import request from "supertest";
import { app } from "../../src/app.js";

describe("/*", () => {
  it("El servidor responde con un código 501 por defecto", async () => {
    await request(app).get("/test").expect(501);
  });
});
