import { fileURLToPath } from "node:url";
export const uploadDirectory = fileURLToPath(
  new URL("../../uploads/", import.meta.url),
);
