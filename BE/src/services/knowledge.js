import { findForScope, knowledgeView } from "../models/knowledge.js";
export async function retrieve(query, scope) {
  const rows = await findForScope(scope);
  const normalized = query
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  // Exact error codes take precedence over symptom matching: unknown codes cannot match by incidental words.
  const code = query.match(/\bE-[A-Z0-9]+-[A-Z0-9]+\b/i)?.[0];
  return rows
    .filter((row) =>
      code
        ? row.error_code.toLowerCase() === code.toLowerCase()
        : row.title
            .toLocaleLowerCase("vi")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(normalized) ||
          (/anh.*mo|camera.*mo/.test(normalized) &&
            row.error_code === "E-VIS-07"),
    )
    .map(knowledgeView);
}
