import { faker } from "@faker-js/faker";
import app from "app";
import prisma from "config/database";
import httpStatus from "http-status";
import supertest from "supertest";
import { createConsole, createGame } from "../factories";
import { cleanDb, disconnectDb } from "../helpers";

const server = supertest(app);

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

describe("GET /games", () => {
  it("Should respond with status 200 and with an empty array when game table is empty", async () => {
    const result = await server.get("/games");
    expect(result.status).toBe(httpStatus.OK);
    expect(result.body).toHaveLength(0);
  });

  it("Should respond with status 200 and with games data", async () => {
    const consoleData = await createConsole();
    const gameData = await createGame(consoleData.id);

    const result = await server.get("/games");
    expect(result.status).toBe(httpStatus.OK);
    expect(result.body).toEqual([
      {
        id: gameData.id,
        title: gameData.title,
        consoleId: gameData.consoleId,
        Console: {
          id: consoleData.id,
          name: consoleData.name,
        },
      },
    ]);
  });
});

describe("GET /games/:id", () => {
  it("Should respond with status 404 when given game does not exist", async () => {
    const result = await server.get("/games/0");
    expect(result.status).toBe(httpStatus.NOT_FOUND);
  });

  it("Should respond with status 200 and with game data", async () => {
    const consoleData = await createConsole();
    const gameData = await createGame(consoleData.id);

    const result = await server.get(`/games/${gameData.id}`);
    expect(result.status).toBe(httpStatus.OK);
    expect(result.body).toEqual({
      id: gameData.id,
      title: gameData.title,
      consoleId: gameData.consoleId,
    });
  });
});

describe("POST /games", () => {
  it("Should respond with status 422 when given body is invalid", async () => {
    const result = await server.post("/games").send({
      invalidField: "invalid",
    });
    expect(result.status).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });

  describe("When body is valid", () => {
    it("Should respond with status 409 when given game already exists", async () => {
      const consoleData = await createConsole();
      const gameData = await createGame(consoleData.id);

      const result = await server.post("/games").send({
        title: gameData.title,
        consoleId: consoleData.id,
      });
      expect(result.status).toBe(httpStatus.CONFLICT);
    });

    it("Should respond with status 409 when given console does not exist", async () => {
      const gameTitle = faker.commerce.productName();
      const consoleId = faker.datatype.number();

      const result = await server.post("/games").send({
        title: gameTitle,
        consoleId: consoleId,
      });
      expect(result.status).toBe(httpStatus.CONFLICT);
    });

    it("Should respond with status 201 and create new game", async () => {
      const consoleData = await createConsole();
      const gameTitle = faker.commerce.productName();

      const result = await server.post("/games").send({
        title: gameTitle,
        consoleId: consoleData.id,
      });
      expect(result.status).toBe(httpStatus.CREATED);

      const entityCreated = await prisma.game.findUnique({
        where: {
          title: gameTitle,
        },
      });
      expect(entityCreated).toEqual({
        id: expect.any(Number),
        title: gameTitle,
        consoleId: consoleData.id,
      });
    });
  });
});
