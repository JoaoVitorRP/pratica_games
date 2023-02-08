import { faker } from "@faker-js/faker";
import app from "app";
import prisma from "config/database";
import httpStatus from "http-status";
import supertest from "supertest";
import { createConsole } from "../factories";
import { cleanDb, disconnectDb } from "../helpers";

const server = supertest(app);

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe("GET /consoles", () => {
  it("Should respond with status 200 and with an empty array when console table is empty", async () => {
    const result = await server.get("/consoles");
    expect(result.status).toBe(httpStatus.OK);
    expect(result.body).toHaveLength(0);
  });

  it("Should respond with status 200 and with consoles data", async () => {
    const consoleData = await createConsole();

    const result = await server.get("/consoles");
    expect(result.status).toBe(httpStatus.OK);
    expect(result.body).toEqual([
      {
        id: consoleData.id,
        name: consoleData.name,
      },
    ]);
  });
});

describe("GET /consoles/:id", () => {
  it("Should respond with status 404 when given console does not exist", async () => {
    const result = await server.get("/consoles/0");
    expect(result.status).toBe(httpStatus.NOT_FOUND);
  });

  it("Should respond with status 200 and with console data", async () => {
    const consoleData = await createConsole();

    const result = await server.get(`/consoles/${consoleData.id}`);
    expect(result.status).toBe(httpStatus.OK);
    expect(result.body).toEqual({
      id: consoleData.id,
      name: consoleData.name,
    });
  });
});

describe("POST /consoles", () => {
  it("Should respond with status 422 when given body is invalid", async () => {
    const result = await server.post("/consoles").send({
      invalidField: "invalid",
    });
    expect(result.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });

  describe("When body is valid", () => {
    it("Should respond with status 409 when given console already exists", async () => {
      const consoleData = await createConsole();

      const result = await server.post("/consoles").send({
        name: consoleData.name,
      });
      expect(result.status).toBe(httpStatus.CONFLICT);
    });

    it("Should respond with status 201 and create new console", async () => {
      const consoleName = faker.internet.domainWord();

      const result = await server.post("/consoles").send({
        name: consoleName,
      });
      expect(result.status).toBe(httpStatus.CREATED);

      const entityCreated = await prisma.console.findUnique({
        where: {
          name: consoleName,
        },
      });
      expect(entityCreated).toEqual({
        id: expect.any(Number),
        name: consoleName,
      });
    });
  });
});
