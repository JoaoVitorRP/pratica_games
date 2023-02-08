import { PrismaClient } from "@prisma/client";
import { loadEnvs } from "./envs";

loadEnvs();

const prisma = new PrismaClient();

export default prisma;
