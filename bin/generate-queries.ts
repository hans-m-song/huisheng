import fs from "fs";

const [source, destination] = process.argv.slice(2);
console.log({ source, destination });

console.log("reading from source...");
const raw = fs.readFileSync(source).toString();
const rawQueries = raw.split(/\n{2,}/g);

console.log("parsing and transforming...");
const set = new Set();
const uniques = (inputs?: any[]) => Array.from(new Set(inputs));
const transformed = rawQueries.map((raw, i) => {
  const [header, ...lines] = raw.split("\n");
  const name = header
    .replace(/^-- name:\s*/, "")
    .replace(/:.*$/, "")
    .trim();
  const capitalised = name[0].toUpperCase() + name.slice(1);

  // const execType = header.split(/\s+/g).pop()?.replace(/^:/, "");
  if (set.has(name)) {
    throw new Error(`query ${name} was already defined (index: ${i})`);
  }
  set.add(name);

  const query = lines
    .join(" ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/;$/, "")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")");

  const args = uniques(
    query.match(/\$[a-z0-9]+/gi)?.map((arg) => arg.slice(1)),
  );
  const table = uniques(
    query
      .match(/(FROM|INTO|UPDATE)\s+([a-z0-9]+)/gi)
      ?.map((match) => match.replace(/(FROM|INTO|UPDATE)\s+/, "")),
  );
  console.log({ name, args, table, query });

  const tableComment = `tables: ${table.map((i) => `\`${i}\``).join(", ")}`;
  const argComment = `args: ${args.map((i) => `\`${i}\``).join(", ") || "N/A"}`;
  const sqlDeclaration = `export const ${name} = \`${query}\`;`;
  return [
    "/**",
    " * " + tableComment,
    " *",
    " * " + argComment,
    " */",
    sqlDeclaration,
  ].join("\n");
});

console.log("writing to destination...");
fs.writeFileSync(
  destination,
  transformed.toSorted((a, b) => a.localeCompare(b)).join("\n\n") + "\n",
);
