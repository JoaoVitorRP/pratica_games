import { faker } from "@faker-js/faker";
import prisma from "config/database";

export function createGame(consoleId: number) {
  return prisma.game.create({
    data: {
      title: faker.commerce.productName(),
      consoleId: consoleId,
    },
  });
}
