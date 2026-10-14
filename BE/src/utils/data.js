import { randomUUID } from "node:crypto";
export const newId = (prefix) => `${prefix}-${randomUUID()}`;
export const json = (value) =>
  typeof value === "string" ? JSON.parse(value) : value;
export const scoped = (row) => ({
  machine: row.machine,
  station: row.station,
  product: row.product,
});
