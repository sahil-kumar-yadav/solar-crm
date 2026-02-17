import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  // Allow storing prisma in globalThis for dev hot-reload
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const client = global.__prismaClient ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__prismaClient = client;

export default client;
