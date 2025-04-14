#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __glob = (map) => (path) => {
  var fn = map[path];
  if (fn) return fn();
  throw new Error("Module not found in bundle: " + path);
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/util/generate-interface-name.ts
var generate_interface_name_exports = {};
__export(generate_interface_name_exports, {
  generateInterfaceName: () => generateInterfaceName
});
function generateInterfaceName(str) {
  return str.split(".").map((part) => {
    const suffix = part.slice(1).replace(/_\w/g, (x) => x[1].toUpperCase());
    return part.charAt(0).toUpperCase() + suffix;
  }).join("");
}
var init_generate_interface_name = __esm({
  "src/util/generate-interface-name.ts"() {
  }
});

// src/athena.ts
var athena_exports = {};
__export(athena_exports, {
  generate: () => generate
});
function mapType(rawType, enumValues, udtTypeMapping = {}) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  let type = rawType.toLowerCase();
  type = type.replace(/\s+for\s+bit\s+data/, "");
  if (udtTypeMapping[type]) {
    return udtTypeMapping[type];
  }
  if (/int64|float64|numeric|bignumeric/.test(type)) return "number";
  if (/string/.test(type)) return "string";
  if (/bytes/.test(type)) return "Buffer";
  if (/bool/.test(type)) return "boolean";
  if (/date/.test(type)) return "string";
  if (/datetime/.test(type)) return "string";
  if (/timestamp/.test(type)) return "string";
  if (/time/.test(type)) return "string";
  if (/json/.test(type)) return "Record<string, any>";
  if (/struct/.test(type)) return "Record<string, any>";
  if (/array/.test(type)) return "any[]";
  return "any";
}
function generate(sql, options) {
  const tables = parseSQL(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL(sql) {
  const tables = [];
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+(external\s+)?table\s+(`?[\w.-]+`?)\s*\(([\s\S]+?)\)\s*(row format|stored as|location|tblproperties|partitioned by|with serdeproperties|;)?/gim
    )
  ];
  for (const [, , tableName, rawColumns] of tableBlocks) {
    const columnLines = rawColumns.split(/,(?![^<]*>)/).map((line) => line.trim()).filter(
      (line) => !!line && !/^partitioned\s+by/i.test(line) && !/^row format|stored as|location|tblproperties|with serdeproperties/i.test(
        line
      )
    );
    const columns = [];
    for (const line of columnLines) {
      const match = line.match(
        /^`?([\w-]+)`?\s+([a-zA-Z0-9_<>(),]+)(\s+comment\s+['"](.+?)['"])?(\s+default\s+['"](.+?)['"])?\s*(not\s+null)?\s*(primary\s+key)?/i
      );
      if (!match) continue;
      const [, name, rawType, , comment, , defaultValue, , isPrimaryKey] = match;
      columns.push({
        name,
        rawType,
        isNullable: !/not\s+null/i.test(line),
        comment,
        defaultValue,
        isPrimaryKey: !!isPrimaryKey
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_athena = __esm({
  "src/athena.ts"() {
    init_generate_interface_name();
  }
});

// src/bigquery.ts
var bigquery_exports = {};
__export(bigquery_exports, {
  generate: () => generate2
});
function mapType2(rawType, enumValues, udtTypeMapping = {}) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  let type = rawType.toLowerCase();
  type = type.replace(/\s+for\s+bit\s+data/, "");
  if (udtTypeMapping[type]) {
    return udtTypeMapping[type];
  }
  if (/int64|float64|numeric|bignumeric/.test(type)) return "number";
  if (/string/.test(type)) return "string";
  if (/bytes/.test(type)) return "Buffer";
  if (/bool/.test(type)) return "boolean";
  if (/date/.test(type)) return "string";
  if (/datetime/.test(type)) return "string";
  if (/timestamp/.test(type)) return "string";
  if (/time/.test(type)) return "string";
  if (/json/.test(type)) return "Record<string, any>";
  if (/struct/.test(type)) return "Record<string, any>";
  if (/array/.test(type)) return "any[]";
  return "any";
}
function generate2(sql, options) {
  const tables = parseSQL2(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType2(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL2(sql) {
  const tables = [];
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+(or\s+replace\s+)?table\s+(?:`?[\w.-]+`?\.)?`?([\w$]+)`?\s*\(([\s\S]+?)\)\s*(?:options|partition|cluster|as|;)/gim
    )
  ];
  for (const [, , tableName, rawColumns] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary\s+key|unique|key|constraint|foreign|partition\s+by)/i.test(
        line
      )
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^`?([\w$]+)`?\s+([a-zA-Z0-9_<>]+(?:\s*\([^)]+\))?)([\s\S]*)$/i
      );
      if (!columnMatch) continue;
      const [, rawName, rawTypeFull, rest] = columnMatch;
      const name = rawName.replace(/(^"|"$)/g, "");
      const rawType = rawTypeFull.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /generated\s+always/i.test(rest);
      const commentMatch = rest.match(/--\s*(.+)$/);
      const comment = commentMatch ? commentMatch[1] : void 0;
      const defaultMatch = rest.match(/default\s+(.+?)(?:[\s,]|$)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_bigquery = __esm({
  "src/bigquery.ts"() {
    init_generate_interface_name();
  }
});

// src/cassandra.ts
var cassandra_exports = {};
__export(cassandra_exports, {
  generate: () => generate3
});
function generate3(sql) {
  const tables = parseSQLForCassandra(sql);
  return tables.map(generateInterface).join("\n\n");
}
function parseSQLForCassandra(sql) {
  const tableDefs = [
    ...sql.matchAll(
      /create\s+table\s+(if\s+not\s+exists\s+)?(`?[\w.]+`?)\s*\(([\s\S]+?)\)\s*(with\s+.*)?;/gim
    )
  ];
  return tableDefs.map((match) => {
    const [, , fullTableName, body] = match;
    const name = fullTableName.replace(/`/g, "");
    const columns = [];
    const columnMatches = [
      ...body.matchAll(
        /`?(\w+)`?\s+([^\s,]+)(?:\s+static)?(?:\s+primary\s+key)?(?:,|\))/gim
      )
    ];
    for (const [, colName, rawType] of columnMatches) {
      columns.push({
        name: colName,
        type: cassandraTypeToTsType(rawType),
        isPrimaryKey: /primary\s+key/i.test(body),
        isStatic: /static/i.test(body)
      });
    }
    return {
      name,
      columns
    };
  });
}
function generateInterface(table) {
  const interfaceName = generateInterfaceName(table.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of table.columns) {
    const optional = col.isPrimaryKey ? "" : "?";
    lines.push(`  ${col.name}${optional}: ${col.type};`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
function cassandraTypeToTsType(type) {
  let t = type.trim().toLowerCase();
  const frozenMatch = t.match(/^frozen<(.+)>$/i);
  if (frozenMatch) {
    return cassandraTypeToTsType(frozenMatch[1]);
  }
  const tupleMatch = t.match(/^tuple<(.+)>$/i);
  if (tupleMatch) {
    const fields = splitTopLevelArgs(tupleMatch[1]);
    return `[${fields.map((f) => cassandraTypeToTsType(f)).join(", ")}]`;
  }
  const listMatch = t.match(/^(list|set)<(.+)>$/i);
  if (listMatch) {
    return `${cassandraTypeToTsType(listMatch[2])}[]`;
  }
  const mapMatch = t.match(/^map<([^,]+),\s*(.+)>$/i);
  if (mapMatch) {
    const [, k, v] = mapMatch;
    return `{ [key: ${cassandraTypeToTsType(k)}]: ${cassandraTypeToTsType(v)} }`;
  }
  if ([
    "int",
    "bigint",
    "varint",
    "smallint",
    "tinyint",
    "decimal",
    "double",
    "float",
    "counter"
  ].includes(t)) {
    return "number";
  }
  if (["text", "varchar", "ascii", "inet", "uuid", "timeuuid"].includes(t)) {
    return "string";
  }
  if (["boolean"].includes(t)) {
    return "boolean";
  }
  if (["timestamp", "date", "time"].includes(t)) {
    return "string";
  }
  if (t === "blob") return "Buffer";
  return "any";
}
function splitTopLevelArgs(str) {
  const args2 = [];
  let depth = 0;
  let current = "";
  for (const char of str) {
    if (char === "<") depth++;
    if (char === ">") depth--;
    if (char === "," && depth === 0) {
      args2.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) args2.push(current.trim());
  return args2;
}
var init_cassandra = __esm({
  "src/cassandra.ts"() {
    init_generate_interface_name();
  }
});

// src/clickhouse.ts
var clickhouse_exports = {};
__export(clickhouse_exports, {
  generate: () => generate4
});
function generate4(sql) {
  const tables = parseSQLForClickHouse(sql);
  return tables.map(generateInterface2).join("\n\n");
}
function parseSQLForClickHouse(sql) {
  const tableDefs = [
    ...sql.matchAll(
      /create\s+table\s+(`?[\w.]+`?)\s*\(([\s\S]+?)\)\s*(engine\s+.*|comment\s+'.*'|settings\s+.*)?/gim
    )
  ];
  return tableDefs.map((match) => {
    const [, fullTableName, body] = match;
    const name = fullTableName.replace(/`/g, "");
    const columns = [];
    const columnMatches = [
      ...body.matchAll(
        /`?(\w+)`?\s+([^\s,]+(?:\([^)]*\))?(?:\s*\([^)]+\))?)\s*(?:comment\s+'([^']*)')?,?/gim
      )
    ];
    for (const [, colName, rawType, comment] of columnMatches) {
      columns.push({
        name: colName,
        type: clickhouseTypeToTsType(rawType),
        comment: comment?.trim()
      });
    }
    return {
      name,
      columns
    };
  });
}
function generateInterface2(table) {
  const interfaceName = generateInterfaceName(table.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of table.columns) {
    const comment = col.comment ? ` // ${col.comment}` : "";
    lines.push(`  ${col.name}: ${col.type};${comment}`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
function clickhouseTypeToTsType(type) {
  let t = type.toLowerCase().trim();
  const nullableMatch = t.match(/^nullable\((.+)\)$/i);
  if (nullableMatch) {
    return `${clickhouseTypeToTsType(nullableMatch[1])} | null`;
  }
  const arrayMatch = t.match(/^array\((.+)\)$/i);
  if (arrayMatch) {
    return `${clickhouseTypeToTsType(arrayMatch[1])}[]`;
  }
  const mapMatch = t.match(/^map\(([^,]+),\s*(.+)\)$/i);
  if (mapMatch) {
    const [_, k, v] = mapMatch;
    return `{ [key: ${clickhouseTypeToTsType(k)}]: ${clickhouseTypeToTsType(v)} }`;
  }
  const tupleMatch = t.match(/^tuple\((.+)\)$/i);
  if (tupleMatch) {
    const fields = splitTopLevelArgs2(tupleMatch[1]);
    return `[${fields.map((f) => clickhouseTypeToTsType(f)).join(", ")}]`;
  }
  if (t.startsWith("int") || t.startsWith("uint") || t === "float32" || t === "float64" || t === "decimal")
    return "number";
  if (t === "string" || t === "fixedstring") return "string";
  if (t === "datetime" || t === "date" || t.startsWith("datetime64"))
    return "string";
  if (t === "uuid") return "string";
  if (t === "boolean") return "boolean";
  return "any";
}
function splitTopLevelArgs2(str) {
  const args2 = [];
  let depth = 0;
  let current = "";
  for (const char of str) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      args2.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) args2.push(current.trim());
  return args2;
}
var init_clickhouse = __esm({
  "src/clickhouse.ts"() {
    init_generate_interface_name();
  }
});

// src/cockroachdb.ts
var cockroachdb_exports = {};
__export(cockroachdb_exports, {
  generate: () => generate5
});
function generate5(sql) {
  const tables = parseSQLForCockroachDB(sql);
  return tables.map(generateInterface3).join("\n\n");
}
function parseSQLForCockroachDB(sql) {
  const tableDefs = [
    ...sql.matchAll(/create\s+table\s+(`?[\w.]+`?)\s*\(([\s\S]+?)\)\s*\)?/gim)
  ];
  return tableDefs.map((match) => {
    const [, fullTableName, body] = match;
    const name = fullTableName.replace(/`/g, "");
    const columns = [];
    const columnMatches = [
      ...body.matchAll(
        /`?(\w+)`?\s+([^\s,]+(?:\([^)]+\))?)(?:\s+(?:not\s+null|null))?(?:\s+default\s+[^,]+)?(?:\s+collate\s+\w+)?(?:\s+comment\s+'([^']*)')?,?/gim
      )
    ];
    for (const [, colName, rawType, comment] of columnMatches) {
      columns.push({
        name: colName,
        type: cockroachTypeToTsType(rawType),
        comment: comment?.trim()
      });
    }
    return {
      name,
      columns
    };
  });
}
function generateInterface3(table) {
  const interfaceName = generateInterfaceName(table.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of table.columns) {
    const comment = col.comment ? ` // ${col.comment}` : "";
    lines.push(`  ${col.name}: ${col.type};${comment}`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
function cockroachTypeToTsType(type) {
  let t = type.toLowerCase().trim();
  if (t.startsWith("int") || t.startsWith("decimal") || t.startsWith("float") || t === "serial")
    return "number";
  if (t.startsWith("bool")) return "boolean";
  if (t.startsWith("varchar") || t.startsWith("char") || t.startsWith("text") || t.startsWith("string"))
    return "string";
  if (t.startsWith("timestamp") || t.startsWith("date") || t.startsWith("time") || t === "interval")
    return "string";
  if (t === "uuid") return "string";
  if (t === "json" || t === "jsonb") return "any";
  if (t === "inet") return "string";
  if (t === "bytes") return "Uint8Array";
  if (t === "bit") return "number";
  return "any";
}
var init_cockroachdb = __esm({
  "src/cockroachdb.ts"() {
    init_generate_interface_name();
  }
});

// src/duckdb.ts
var duckdb_exports = {};
__export(duckdb_exports, {
  generate: () => generate6
});
function generate6(sql) {
  const tables = parseSQLForDuckDB(sql);
  return tables.map(generateInterface4).join("\n\n");
}
function parseSQLForDuckDB(sql) {
  const tableDefs = [
    ...sql.matchAll(/create\s+table\s+(`?[\w.]+`?)\s*\(([^;]+?)\)/gim)
  ];
  return tableDefs.map((match) => {
    const [, fullTableName, body] = match;
    const name = fullTableName.replace(/`/g, "");
    const columns = [];
    const columnMatches = [
      ...body.matchAll(
        /`?(\w+)`?\s+([^\s,]+(?:\([^)]*\))?)\s*(?:--\s*(.*))?,?/gim
      )
    ];
    for (const [, colName, rawType, comment] of columnMatches) {
      columns.push({
        name: colName,
        type: duckdbTypeToTsType(rawType),
        comment: comment?.trim()
      });
    }
    return {
      name,
      columns
    };
  });
}
function generateInterface4(table) {
  const interfaceName = generateInterfaceName(table.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of table.columns) {
    const comment = col.comment ? ` // ${col.comment}` : "";
    lines.push(`  ${col.name}: ${col.type};${comment}`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
function duckdbTypeToTsType(type) {
  const t = type.toLowerCase().trim();
  if (t.startsWith("int") || t.startsWith("decimal") || t === "float" || t === "double")
    return "number";
  if (t === "bool" || t === "boolean") return "boolean";
  if (t.startsWith("varchar") || t === "text" || t === "string")
    return "string";
  if (t === "date" || t === "timestamp" || t.startsWith("timestamp"))
    return "string";
  if (t === "blob") return "Uint8Array";
  return "any";
}
var init_duckdb = __esm({
  "src/duckdb.ts"() {
    init_generate_interface_name();
  }
});

// src/flink.ts
var flink_exports = {};
__export(flink_exports, {
  generate: () => generate7
});
function generate7(sql) {
  const tables = parseSQLForFlink(sql);
  return tables.map((table) => generateInterface5(table)).join("\n\n");
}
function parseSQLForFlink(sql) {
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+(temporary\s+)?(table|view)\s+`?(\w+(?:\.\w+)?)`?\s*\(([\s\S]+?)\)\s*(with|partitioned|comment|primary|foreign|not\s+null|unique|watermark|as|stored|tblproperties)?/gim
    )
  ];
  return tableBlocks.map((match) => {
    const [, , type, name, body] = match;
    const columns = [];
    const columnMatches = [
      ...body.matchAll(
        /`?(\w+)`?\s+([^\s,]+(?:<[^>]+>)?)\s*(?:as\s+[^,]+)?(?:\s+comment\s+'([^']*)')?/gim
      )
    ];
    for (const [, columnName, rawType, comment] of columnMatches) {
      columns.push({
        name: columnName,
        type: flinkTypeToTsType(rawType),
        comment: comment?.trim()
      });
    }
    return {
      name,
      type,
      columns
    };
  });
}
function generateInterface5(table) {
  const interfaceName = generateInterfaceName(table.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of table.columns) {
    const comment = col.comment ? ` // ${col.comment}` : "";
    lines.push(`  ${col.name}: ${col.type};${comment}`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
function flinkTypeToTsType(flinkType) {
  const type = flinkType.toLowerCase();
  if (type.startsWith("varchar") || type.startsWith("char") || type.startsWith("string"))
    return "string";
  if (type.startsWith("boolean")) return "boolean";
  if (type.startsWith("tinyint") || type.startsWith("smallint") || type.startsWith("int") || type.startsWith("bigint") || type.startsWith("float") || type.startsWith("double") || type.startsWith("decimal") || type.startsWith("numeric"))
    return "number";
  if (type.startsWith("date") || type.startsWith("time") || type.startsWith("timestamp"))
    return "string";
  if (type.startsWith("binary") || type.startsWith("bytes")) return "Buffer";
  if (type.startsWith("array<"))
    return `${flinkTypeToTsType(type.slice(6, -1))}[]`;
  if (type.startsWith("map<")) {
    const [k, v] = splitMapKeyValue(type.slice(4, -1));
    return `{ [key: ${flinkTypeToTsType(k)}]: ${flinkTypeToTsType(v)} }`;
  }
  if (type.startsWith("multiset<"))
    return `${flinkTypeToTsType(type.slice(9, -1))}[]`;
  if (type.startsWith("row<")) {
    const inner = type.slice(4, -1);
    const fields = inner.split(/\s*,\s*(?![^<]*>)/).map((f) => {
      const [key, ...rest] = f.trim().split(/\s+/);
      return `${key}: ${flinkTypeToTsType(rest.join(" "))}`;
    });
    return `{ ${fields.join("; ")} }`;
  }
  return "any";
}
function splitMapKeyValue(str) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of str) {
    if (char === "<") depth++;
    if (char === ">") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return [parts[0], parts[1]];
}
var init_flink = __esm({
  "src/flink.ts"() {
    init_generate_interface_name();
  }
});

// src/hive.ts
var hive_exports = {};
__export(hive_exports, {
  generate: () => generate8
});
function generate8(sql) {
  const tableBlocks = parseSQL3(sql, {
    statementPrefix: /(CREATE\s+(?:EXTERNAL\s+)?TABLE)\s+([\w.]+)/gi,
    statementType: "hive"
  });
  const outputLines = tableBlocks.map((block) => {
    const tableName = generateInterfaceName(block.name);
    const fields = block.columns.map((col) => {
      const tsType = convertToTypeScript(col.type, "hive");
      return `  /** ${col.comment || ""} */
  ${col.name}: ${tsType};`;
    });
    return `declare interface ${tableName} {
${fields.join("\n")}
}`;
  });
  return outputLines.join("\n\n");
}
function convertToTypeScript(type, dialect) {
  const baseType = type.toLowerCase().trim();
  if (baseType.startsWith("array<")) {
    const inner = baseType.match(/^array<(.*)>$/)?.[1]?.trim() || "any";
    return `${convertToTypeScript(inner, dialect)}[]`;
  }
  if (baseType.startsWith("map<")) {
    const match = baseType.match(/^map<([^,]+),\s*(.+)>$/);
    if (match) {
      const keyType = convertToTypeScript(match[1], dialect);
      const valueType = convertToTypeScript(match[2], dialect);
      return `Record<${keyType}, ${valueType}>`;
    }
    return "Record<string, any>";
  }
  if (baseType.startsWith("struct<")) {
    const structBody = baseType.slice(7, -1);
    const fields = structBody.split(",").map((field) => {
      const [name, typ] = field.trim().split(":");
      return `${name}: ${convertToTypeScript(typ, dialect)}`;
    });
    return `{ ${fields.join("; ")} }`;
  }
  switch (baseType.split("(")[0]) {
    case "tinyint":
    case "smallint":
    case "int":
    case "bigint":
    case "float":
    case "double":
    case "decimal":
      return "number";
    case "boolean":
      return "boolean";
    case "char":
    case "varchar":
    case "string":
      return "string";
    case "timestamp":
    case "date":
      return "string";
    // or 'Date' if you want to post-process
    case "binary":
      return "Uint8Array";
    // or 'Buffer'
    default:
      return "any";
  }
}
function parseSQL3(sql, options) {
  const blocks = [];
  const { statementPrefix } = options;
  let match;
  while ((match = statementPrefix.exec(sql)) !== null) {
    const fullMatch = match[0];
    const tableName = match[2];
    const startIndex = match.index + fullMatch.length;
    const subSql = sql.slice(startIndex);
    const openIndex = subSql.indexOf("(");
    if (openIndex === -1) continue;
    let depth = 0;
    let endIndex = -1;
    for (let i = openIndex; i < subSql.length; i++) {
      if (subSql[i] === "(") depth++;
      else if (subSql[i] === ")") depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
    if (endIndex === -1) continue;
    const columnBlock = subSql.slice(openIndex + 1, endIndex);
    const columnLines = columnBlock.split(/,(?![^\<]*\>)/).map((line) => line.trim()).filter((line) => /^[\w"`]+/.test(line));
    const columns = columnLines.map((line) => {
      const nameMatch = line.match(/^["`]?([\w]+)["`]?/);
      const typeMatch = line.match(/^[\w"`]+\s+([^\s]+(?:<.*?>)?)/);
      const commentMatch = line.match(/comment\s+'([^']+)'/i);
      return {
        name: nameMatch?.[1] || "",
        type: typeMatch?.[1] || "any",
        comment: commentMatch?.[1]
      };
    });
    blocks.push({
      name: tableName,
      columns
    });
  }
  return blocks;
}
var init_hive = __esm({
  "src/hive.ts"() {
    init_generate_interface_name();
  }
});

// src/ibmdb2.ts
var ibmdb2_exports = {};
__export(ibmdb2_exports, {
  generate: () => generate9
});
function mapType3(rawType, enumValues, udtTypeMapping = {}) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  let type = rawType.toLowerCase();
  type = type.replace(/\s+for\s+bit\s+data/, "");
  if (udtTypeMapping[type]) {
    return udtTypeMapping[type];
  }
  if (/tinyint|smallint|mediumint|int|bigint|integer/.test(type))
    return "number";
  if (/decimal|numeric|decfloat|real|double/.test(type)) return "number";
  if (/char|nchar|nvarchar|varchar|graphic|vargraphic|clob|dbclob/.test(type))
    return "string";
  if (/binary|varbinary|blob/.test(type)) return "Buffer";
  if (/date|time|timestamp/.test(type)) return "string";
  if (/boolean|bool/.test(type)) return "boolean";
  if (/rowid|uuid|uniqueidentifier/.test(type)) return "string";
  if (/xml/.test(type)) return "string";
  if (/json/.test(type)) return "Record<string, any>";
  if (/cursor/.test(type)) return "any";
  if (/st_point|st_linestring|st_polygon|st_geometry/.test(type))
    return "string";
  return "any";
}
function generate9(sql, options) {
  const tables = parseSQL4(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType3(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL4(sql) {
  if (!/create\s+table/i.test(sql)) return [];
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+table\s+(?:("[^"]+"|\w+)\.)?("?[\w$]+"?)\s*\(([\s\S]+?)\)\s*(?:partition\s+by|organize\s+by|with|compress|data\s+initially|;)?/gim
    )
  ];
  const tables = [];
  for (const [
    ,
    /*schema*/
    ,
    tableName,
    rawColumns
  ] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary\s+key|unique|key|constraint|foreign|period\s+for|partition\s+by)/i.test(
        line
      )
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^("?[\w$]+"?)\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?(?:\s+FOR\s+BIT\s+DATA)?)([\s\S]*)$/i
      );
      if (!columnMatch) continue;
      const [, rawName, rawTypeFull, rest] = columnMatch;
      const name = rawName.replace(/(^"|"$)/g, "");
      const rawType = rawTypeFull.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /generated\s+always\s+as\s+identity/i.test(rest);
      const commentMatch = rest.match(/--\s*(.+)$/);
      const comment = commentMatch ? commentMatch[1] : void 0;
      const defaultMatch = rest.match(/default\s+(.+?)(?:[\s,]|$)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_ibmdb2 = __esm({
  "src/ibmdb2.ts"() {
    init_generate_interface_name();
  }
});

// src/mariadb.ts
var mariadb_exports = {};
__export(mariadb_exports, {
  generate: () => generate10
});
function mapType4(rawType, enumValues) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  const type = rawType.toLowerCase();
  if (/tinyint|smallint|mediumint|int|bigint|decimal|float|double/.test(type))
    return "number";
  if (/char|varchar|text|longtext|enum|set/.test(type)) return "string";
  if (/date|datetime|timestamp|time|year/.test(type)) return "string";
  if (/bool|boolean/.test(type)) return "boolean";
  if (/binary|varbinary|blob|longblob/.test(type)) return "Buffer";
  if (/json/.test(type)) return "Record<string, any>";
  return "any";
}
function generate10(sql, options) {
  const tables = parseSQL5(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType4(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL5(sql) {
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+table\s+[`"]?(\w+)[`"]?\s*\(([\s\S]+?)\)\s*(engine|comment|with|stored|partition|;)/gim
    )
  ];
  const tables = [];
  for (const [, tableName, rawColumns] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary|unique|key|constraint|foreign)/i.test(line)
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^\s*[`"]?(\w+)[`"]?\s+([a-zA-Z0-9_]+(?:\s*\(([^)]*)\))?)([\s\S]*)$/
      );
      if (!columnMatch) continue;
      const [, name, typeWithParens, parenContent, rest] = columnMatch;
      const rawType = typeWithParens.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /auto_increment/i.test(rest);
      const commentMatch = rest.match(/comment\s+['"]([^'"]+)['"]/i);
      const comment = commentMatch ? commentMatch[1] : void 0;
      let enumValues;
      if (/^enum/i.test(rawType) && parenContent) {
        enumValues = parenContent.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim().replace(/^'(.*)'$/, "$1"));
      }
      const lengthMatch = rawType.match(/\w+\((\d+)\)/);
      const length = lengthMatch ? parseInt(lengthMatch[1], 10) : void 0;
      const precisionScaleMatch = rawType.match(/\w+\((\d+),(\d+)\)/);
      const precision = precisionScaleMatch ? parseInt(precisionScaleMatch[1], 10) : void 0;
      const scale = precisionScaleMatch ? parseInt(precisionScaleMatch[2], 10) : void 0;
      const defaultMatch = rest.match(/default\s+(['"]?[^"]+['"]?)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        enumValues,
        length,
        precision,
        scale,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_mariadb = __esm({
  "src/mariadb.ts"() {
    init_generate_interface_name();
  }
});

// src/mysql.ts
var mysql_exports = {};
__export(mysql_exports, {
  generate: () => generate11
});
function mapType5(rawType, enumValues) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  const type = rawType.toLowerCase();
  if (/int|float|double|decimal|numeric|real/.test(type)) return "number";
  if (/char|text|uuid|json|enum|set/.test(type)) return "string";
  if (/date|time|year/.test(type)) return "string";
  if (/bool|bit/.test(type)) return "boolean";
  if (/binary|blob/.test(type)) return "Buffer";
  return "any";
}
function generate11(sql, options) {
  const tables = parseSQL6(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType5(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL6(sql) {
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+table\s+[`"]?(\w+)[`"]?\s*\(([\s\S]+?)\)\s*(engine|comment|with|stored|partition|;)/gim
    )
  ];
  const tables = [];
  for (const [, tableName, rawColumns] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary|unique|key|constraint|foreign)/i.test(line)
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^\s*[`"]?(\w+)[`"]?\s+([a-zA-Z0-9_]+(?:\s*\(([^)]*)\))?)([\s\S]*)$/
      );
      if (!columnMatch) continue;
      const [, name, typeWithParens, parenContent, rest] = columnMatch;
      const rawType = typeWithParens.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /auto_increment/i.test(rest);
      const commentMatch = rest.match(/comment\s+['"]([^'"]+)['"]/i);
      const comment = commentMatch ? commentMatch[1] : void 0;
      let enumValues;
      if (/^enum/i.test(rawType) && parenContent) {
        enumValues = parenContent.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim().replace(/^'(.*)'$/, "$1"));
      }
      const lengthMatch = rawType.match(/\w+\((\d+)\)/);
      const length = lengthMatch ? parseInt(lengthMatch[1], 10) : void 0;
      const precisionScaleMatch = rawType.match(/\w+\((\d+),(\d+)\)/);
      const precision = precisionScaleMatch ? parseInt(precisionScaleMatch[1], 10) : void 0;
      const scale = precisionScaleMatch ? parseInt(precisionScaleMatch[2], 10) : void 0;
      const defaultMatch = rest.match(/default\s+(['"]?[^"']+['"]?)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        enumValues,
        length,
        precision,
        scale,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_mysql = __esm({
  "src/mysql.ts"() {
    init_generate_interface_name();
  }
});

// src/neo4j.ts
var neo4j_exports = {};
__export(neo4j_exports, {
  generate: () => generate12
});
function generate12(cypher) {
  const entities = parseCypherForNeo4j(cypher);
  return entities.map(generateInterface6).join("\n\n");
}
function parseCypherForNeo4j(cypher) {
  const entities = [];
  const nodeMatches = [...cypher.matchAll(/\(:?(\w+)?\s*{([^}]*)}\)/g)];
  for (const [, label, properties] of nodeMatches) {
    const columns = parseProperties(properties);
    entities.push({
      name: label || "UnnamedNode",
      columns
    });
  }
  const relMatches = [...cypher.matchAll(/\[:?(\w+)?\s*{([^}]*)}\]/g)];
  for (const [, label, properties] of relMatches) {
    const columns = parseProperties(properties);
    entities.push({
      name: label || "UnnamedRelationship",
      columns
    });
  }
  return entities;
}
function parseProperties(properties) {
  const columns = [];
  const propMatches = [
    ...properties.matchAll(/(\w+):\s*('[^']*'|\d+(\.\d+)?|true|false|null)/gi)
  ];
  for (const [_, key, value] of propMatches) {
    columns.push({
      name: key,
      type: inferTypeFromValue(value)
    });
  }
  return columns;
}
function inferTypeFromValue(val) {
  if (/^'.*'$/.test(val)) return "string";
  if (/^\d+$/.test(val)) return "number";
  if (/^\d+\.\d+$/.test(val)) return "number";
  if (/true|false/i.test(val)) return "boolean";
  if (/null/i.test(val)) return "any";
  return "any";
}
function generateInterface6(entity) {
  const interfaceName = generateInterfaceName(entity.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of entity.columns) {
    lines.push(`  ${col.name}: ${col.type};`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
var init_neo4j = __esm({
  "src/neo4j.ts"() {
    init_generate_interface_name();
  }
});

// src/oracle.ts
var oracle_exports = {};
__export(oracle_exports, {
  generate: () => generate13
});
function mapType6(rawType, enumValues) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  const type = rawType.toLowerCase();
  if (/number|float|integer|decimal/.test(type)) return "number";
  if (/char|varchar2|clob/.test(type)) return "string";
  if (/date|timestamp/.test(type)) return "string";
  if (/boolean/.test(type)) return "boolean";
  if (/blob/.test(type)) return "Buffer";
  return "any";
}
function generate13(sql, options) {
  const tables = parseSQL7(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType6(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL7(sql) {
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+table\s+[`"]?(\w+)[`"]?\s*\(([\s\S]+?)\)\s*(engine|comment|with|stored|partition|;)/gim
    )
  ];
  const tables = [];
  for (const [, tableName, rawColumns] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary|unique|key|constraint|foreign)/i.test(line)
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^\s*[`"]?(\w+)[`"]?\s+([a-zA-Z0-9_]+(?:\s*\(([^)]*)\))?)([\s\S]*)$/
      );
      if (!columnMatch) continue;
      const [, name, typeWithParens, parenContent, rest] = columnMatch;
      const rawType = typeWithParens.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /auto_increment/i.test(rest);
      const commentMatch = rest.match(/comment\s+['"]([^'"]+)['"]/i);
      const comment = commentMatch ? commentMatch[1] : void 0;
      let enumValues;
      if (/^enum/i.test(rawType) && parenContent) {
        enumValues = parenContent.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim().replace(/^'(.*)'$/, "$1"));
      }
      const lengthMatch = rawType.match(/\w+\((\d+)\)/);
      const length = lengthMatch ? parseInt(lengthMatch[1], 10) : void 0;
      const precisionScaleMatch = rawType.match(/\w+\((\d+),(\d+)\)/);
      const precision = precisionScaleMatch ? parseInt(precisionScaleMatch[1], 10) : void 0;
      const scale = precisionScaleMatch ? parseInt(precisionScaleMatch[2], 10) : void 0;
      const defaultMatch = rest.match(/default\s+(['"]?[^"]+['"]?)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        enumValues,
        length,
        precision,
        scale,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_oracle = __esm({
  "src/oracle.ts"() {
    init_generate_interface_name();
  }
});

// src/postgre.ts
var postgre_exports = {};
__export(postgre_exports, {
  generate: () => generate14
});
function mapType7(rawType, enumValues) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  const type = rawType.toLowerCase();
  if (/serial|bigserial/.test(type)) return "number";
  if (/uuid/.test(type)) return "string";
  if (/json|jsonb/.test(type)) return "any";
  if (/interval/.test(type)) return "string";
  if (/timestamp|date/.test(type)) return "string";
  if (/varchar|char|text/.test(type)) return "string";
  if (/boolean/.test(type)) return "boolean";
  if (/bytea/.test(type)) return "Buffer";
  if (/int|float|double|decimal|numeric|real/.test(type)) return "number";
  return "any";
}
function generate14(sql, options) {
  const tables = parseSQL8(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType7(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL8(sql) {
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+table\s+[`"]?(\w+)[`"]?\s*\(([\s\S]+?)\)\s*(engine|comment|with|stored|partition|;)/gim
    )
  ];
  const tables = [];
  for (const [, tableName, rawColumns] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary|unique|key|constraint|foreign)/i.test(line)
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^\s*[`"]?(\w+)[`"]?\s+([a-zA-Z0-9_]+(?:\s*\(([^)]*)\))?)([\s\S]*)$/
      );
      if (!columnMatch) continue;
      const [, name, typeWithParens, parenContent, rest] = columnMatch;
      const rawType = typeWithParens.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /auto_increment/i.test(rest);
      const commentMatch = rest.match(/comment\s+['"]([^'"]+)['"]/i);
      const comment = commentMatch ? commentMatch[1] : void 0;
      let enumValues;
      if (/^enum/i.test(rawType) && parenContent) {
        enumValues = parenContent.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim().replace(/^'(.*)'$/, "$1"));
      }
      const lengthMatch = rawType.match(/\w+\((\d+)\)/);
      const length = lengthMatch ? parseInt(lengthMatch[1], 10) : void 0;
      const precisionScaleMatch = rawType.match(/\w+\((\d+),(\d+)\)/);
      const precision = precisionScaleMatch ? parseInt(precisionScaleMatch[1], 10) : void 0;
      const scale = precisionScaleMatch ? parseInt(precisionScaleMatch[2], 10) : void 0;
      const defaultMatch = rest.match(/default\s+(['"]?[^"]+['"]?)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        enumValues,
        length,
        precision,
        scale,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_postgre = __esm({
  "src/postgre.ts"() {
    init_generate_interface_name();
  }
});

// src/presto.ts
var presto_exports = {};
__export(presto_exports, {
  generate: () => generate15
});
function generate15(sql) {
  const tables = parseSQLForPresto(sql);
  return tables.map(generateInterface7).join("\n\n");
}
function parseSQLForPresto(sql) {
  const tableDefs = [
    ...sql.matchAll(
      /create\s+table\s+([\w."]+)\s*\(([\s\S]+?)\)\s*(comment\s+|with\s*\(|as\s+select|location\s+)?/gim
    )
  ];
  return tableDefs.map((match) => {
    const [, fullTableName, body] = match;
    const name = fullTableName.replace(/["]/g, "");
    const columns = [];
    const columnMatches = [
      ...body.matchAll(/"?(\w+)"?\s+([^\s,]+)(?:\s+comment\s+'([^']*)')?,?/gim)
    ];
    for (const [, colName, rawType, comment] of columnMatches) {
      columns.push({
        name: colName,
        type: prestoTypeToTsType(rawType),
        comment: comment?.trim()
      });
    }
    return {
      name,
      columns
    };
  });
}
function generateInterface7(table) {
  const interfaceName = generateInterfaceName(table.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of table.columns) {
    const comment = col.comment ? ` // ${col.comment}` : "";
    lines.push(`  ${col.name}: ${col.type};${comment}`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
function prestoTypeToTsType(type) {
  let t = type.toLowerCase().trim();
  const arrayMatch = t.match(/^array\((.+)\)$/i);
  if (arrayMatch) {
    return `${prestoTypeToTsType(arrayMatch[1])}[]`;
  }
  const mapMatch = t.match(/^map\(([^,]+),\s*(.+)\)$/i);
  if (mapMatch) {
    const [_, k, v] = mapMatch;
    return `{ [key: ${prestoTypeToTsType(k)}]: ${prestoTypeToTsType(v)} }`;
  }
  const rowMatch = t.match(/^row\s*\((.+)\)$/i);
  if (rowMatch) {
    const fields = splitTopLevelArgs3(rowMatch[1]);
    return `{ ${fields.map((f) => {
      const parts = f.trim().split(/\s+/);
      const fname = parts.pop();
      const ftype = parts.join(" ");
      return `${fname}: ${prestoTypeToTsType(ftype)}`;
    }).join("; ")} }`;
  }
  if (t.startsWith("int") || t === "double" || t === "real" || t === "decimal" || t === "bigint" || t === "smallint" || t === "tinyint")
    return "number";
  if (t === "varchar" || t === "char" || t === "string") return "string";
  if (t === "boolean") return "boolean";
  if (t === "date" || t.startsWith("timestamp") || t === "time")
    return "string";
  return "any";
}
function splitTopLevelArgs3(str) {
  const args2 = [];
  let depth = 0;
  let current = "";
  for (const char of str) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      args2.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) args2.push(current.trim());
  return args2;
}
var init_presto = __esm({
  "src/presto.ts"() {
    init_generate_interface_name();
  }
});

// src/redshift.ts
var redshift_exports = {};
__export(redshift_exports, {
  generate: () => generate16
});
function mapType8(rawType, enumValues, udtTypeMapping = {}) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  let type = rawType.toLowerCase();
  type = type.replace(/\s+for\s+bit\s+data/, "");
  if (udtTypeMapping[type]) {
    return udtTypeMapping[type];
  }
  if (/smallint|integer|bigint|decimal|numeric|real|double\s+precision/.test(type))
    return "number";
  if (/char|varchar|text/.test(type)) return "string";
  if (/boolean/.test(type)) return "boolean";
  if (/bytea/.test(type)) return "Buffer";
  if (/date|time|timestamp/.test(type)) return "string";
  if (/json|jsonb/.test(type)) return "Record<string, any>";
  if (/uuid/.test(type)) return "string";
  return "any";
}
function generate16(sql, options) {
  const tables = parseSQL9(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType8(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL9(sql) {
  if (!/create\s+table/i.test(sql)) return [];
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+table\s+(?:("[^"]+"|\w+)\.)?("?[\w$]+"?)\s*\(([\s\S]+?)\)\s*(?:with|on|;)?/gim
    )
  ];
  const tables = [];
  for (const [
    ,
    /* schema */
    ,
    tableName,
    rawColumns
  ] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary\s+key|unique|key|constraint|foreign|partition\s+by)/i.test(
        line
      )
      // 排除主键、唯一约束等
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^("?[\w$]+"?)\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?(?:\s+FOR\s+BIT\s+DATA)?)([\s\S]*)$/i
      );
      if (!columnMatch) continue;
      const [, rawName, rawTypeFull, rest] = columnMatch;
      const name = rawName.replace(/(^"|"$)/g, "");
      const rawType = rawTypeFull.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /generated\s+always\s+as\s+identity/i.test(rest);
      const commentMatch = rest.match(/--\s*(.+)$/);
      const comment = commentMatch ? commentMatch[1] : void 0;
      const defaultMatch = rest.match(/default\s+(.+?)(?:[\s,]|$)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_redshift = __esm({
  "src/redshift.ts"() {
    init_generate_interface_name();
  }
});

// src/snowflake.ts
var snowflake_exports = {};
__export(snowflake_exports, {
  generate: () => generate17
});
function generate17(sql) {
  const tables = parseSQLForSnowflake(sql);
  return tables.map(generateInterface8).join("\n\n");
}
function parseSQLForSnowflake(sql) {
  const tableDefs = [
    ...sql.matchAll(
      /create\s+(or\s+replace\s+)?table\s+(`?[\w.]+`?)\s*\(([^;]+?)\)\s*(comment|cluster|with|as)?/gim
    )
  ];
  return tableDefs.map((match) => {
    const [, , fullTableName, body] = match;
    const name = fullTableName.replace(/`/g, "");
    const columns = [];
    const columnMatches = [
      ...body.matchAll(
        /`?(\w+)`?\s+([^\s,]+(?:\([^)]*\))?)\s*(?:comment\s+'([^']*)')?,?/gim
      )
    ];
    for (const [, colName, rawType, comment] of columnMatches) {
      columns.push({
        name: colName,
        type: snowflakeTypeToTsType(rawType),
        comment: comment?.trim()
      });
    }
    return {
      name,
      columns
    };
  });
}
function generateInterface8(table) {
  const interfaceName = generateInterfaceName(table.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of table.columns) {
    const comment = col.comment ? ` // ${col.comment}` : "";
    lines.push(`  ${col.name}: ${col.type};${comment}`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
function snowflakeTypeToTsType(type) {
  let t = type.toLowerCase().trim();
  if (t === "string" || t.startsWith("varchar") || t.startsWith("char") || t === "text")
    return "string";
  if (t.startsWith("number") || t.startsWith("decimal") || t.startsWith("numeric") || t.startsWith("int") || t.startsWith("double") || t.startsWith("float"))
    return "number";
  if (t === "boolean") return "boolean";
  if (t.startsWith("timestamp") || t === "date" || t === "datetime" || t === "time")
    return "string";
  if (t === "variant" || t === "object") return "Record<string, any>";
  if (t === "array") return "any[]";
  return "any";
}
var init_snowflake = __esm({
  "src/snowflake.ts"() {
    init_generate_interface_name();
  }
});

// src/spanner.ts
var spanner_exports = {};
__export(spanner_exports, {
  generate: () => generate18
});
function generate18(sql) {
  const tables = parseSQLForSpanner(sql);
  return tables.map(generateInterface9).join("\n\n");
}
function parseSQLForSpanner(sql) {
  const tableDefs = [
    ...sql.matchAll(
      /create\s+table\s+([\w.]+)\s*\(([\s\S]+?)\)\s*(primary\s+key|\))/gim
    )
  ];
  return tableDefs.map((match) => {
    const [, fullTableName, body] = match;
    const name = fullTableName.replace(/["]/g, "");
    const columns = [];
    const columnMatches = [
      ...body.matchAll(
        /(\w+)\s+([^\s,]+)(?:\s+not\s+null)?(?:\s+options\s*\(\s*comment\s*=\s*'([^']*)'\s*\))?,?/gim
      )
    ];
    for (const [, colName, rawType, comment] of columnMatches) {
      columns.push({
        name: colName,
        type: spannerTypeToTsType(rawType),
        comment: comment?.trim()
      });
    }
    return {
      name,
      columns
    };
  });
}
function generateInterface9(table) {
  const interfaceName = generateInterfaceName(table.name);
  const lines = [];
  lines.push(`export interface ${interfaceName} {`);
  for (const col of table.columns) {
    const comment = col.comment ? ` // ${col.comment}` : "";
    lines.push(`  ${col.name}: ${col.type};${comment}`);
  }
  lines.push(`}`);
  return lines.join("\n");
}
function spannerTypeToTsType(type) {
  let t = type.toLowerCase().trim();
  const arrayMatch = t.match(/^array<(.+)>$/i);
  if (arrayMatch) {
    return `${spannerTypeToTsType(arrayMatch[1])}[]`;
  }
  if (t === "int64" || t === "float64" || t === "numeric") return "number";
  if (t === "bool") return "boolean";
  if (t === "string" || t === "json") return "string";
  if (t === "date" || t.startsWith("timestamp")) return "string";
  if (t === "bytes") return "Buffer";
  return "any";
}
var init_spanner = __esm({
  "src/spanner.ts"() {
    init_generate_interface_name();
  }
});

// src/sqlite.ts
var sqlite_exports = {};
__export(sqlite_exports, {
  generate: () => generate19
});
function mapType9(rawType, enumValues) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  const type = rawType.toLowerCase();
  if (/integer/.test(type)) return "number";
  if (/real/.test(type)) return "number";
  if (/text/.test(type)) return "string";
  if (/blob/.test(type)) return "Buffer";
  if (/null/.test(type)) return "any";
  return "any";
}
function generate19(sql, options) {
  const tables = parseSQL10(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType9(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL10(sql) {
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+table\s+[`"]?(\w+)[`"]?\s*\(([\s\S]+?)\)\s*(engine|comment|with|stored|partition|;)/gim
    )
  ];
  const tables = [];
  for (const [, tableName, rawColumns] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary|unique|key|constraint|foreign)/i.test(line)
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^\s*[`"]?(\w+)[`"]?\s+([a-zA-Z0-9_]+(?:\s*\(([^)]*)\))?)([\s\S]*)$/
      );
      if (!columnMatch) continue;
      const [, name, typeWithParens, parenContent, rest] = columnMatch;
      const rawType = typeWithParens.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /auto_increment/i.test(rest);
      const commentMatch = rest.match(/comment\s+['"]([^'"]+)['"]/i);
      const comment = commentMatch ? commentMatch[1] : void 0;
      let enumValues;
      if (/^enum/i.test(rawType) && parenContent) {
        enumValues = parenContent.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim().replace(/^'(.*)'$/, "$1"));
      }
      const lengthMatch = rawType.match(/\w+\((\d+)\)/);
      const length = lengthMatch ? parseInt(lengthMatch[1], 10) : void 0;
      const precisionScaleMatch = rawType.match(/\w+\((\d+),(\d+)\)/);
      const precision = precisionScaleMatch ? parseInt(precisionScaleMatch[1], 10) : void 0;
      const scale = precisionScaleMatch ? parseInt(precisionScaleMatch[2], 10) : void 0;
      const defaultMatch = rest.match(/default\s+(['"]?[^"]+['"]?)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        enumValues,
        length,
        precision,
        scale,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_sqlite = __esm({
  "src/sqlite.ts"() {
    init_generate_interface_name();
  }
});

// src/sqlserver.ts
var sqlserver_exports = {};
__export(sqlserver_exports, {
  generate: () => generate20
});
function mapType10(rawType, enumValues) {
  if (enumValues?.length) {
    return enumValues.map((v) => `'${v}'`).join(" | ");
  }
  const type = rawType.toLowerCase();
  if (/tinyint|smallint|mediumint|int|bigint|decimal|numeric|money|smallmoney|float|double|real/.test(
    type
  ))
    return "number";
  if (/char|nchar|nvarchar|ntext|varchar|text|longtext|enum|set/.test(type))
    return "string";
  if (/date|datetime|timestamp|time|year|datetimeoffset/.test(type))
    return "string";
  if (/uniqueidentifier/.test(type)) return "string";
  if (/rowversion/.test(type)) return "Buffer";
  if (/bit|bool|boolean/.test(type)) return "boolean";
  if (/image|xml|binary|varbinary|blob|longblob/.test(type)) return "Buffer";
  if (/json/.test(type)) return "Record<string, any>";
  return "any";
}
function generate20(sql, options) {
  const tables = parseSQL11(sql);
  const lines = [];
  if (options?.namespace) {
    lines.push(`declare namespace ${options.namespace} {`);
  }
  for (const table of tables) {
    const interfaceLine = `${options?.namespace ? "" : "export "}interface ${generateInterfaceName(table.name)} {`;
    lines.push(interfaceLine);
    for (const column of table.columns) {
      const tsType = mapType10(column.rawType, column.enumValues);
      const optional = column.isNullable || column.defaultValue !== void 0 ? "?" : "";
      const comment = column.comment ? ` // ${column.comment}` : "";
      lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
    }
    lines.push("}");
    lines.push("");
  }
  if (options?.namespace) {
    lines.push("}");
  }
  return lines.join("\n");
}
function parseSQL11(sql) {
  const tableBlocks = [
    ...sql.matchAll(
      /create\s+table\s+(?:\[?(\w+)\]?\.)?\[?(\w+)\]?\s*\(([\s\S]+?)\)\s*(?:with|on|textimage_on|;)/gim
    )
  ];
  const tables = [];
  for (const [, schema, tableName, rawColumns] of tableBlocks) {
    const lines = rawColumns.split(/,(?![^()]*\))/).map((line) => line.trim()).filter(
      (line) => !!line && !/^(primary\s+key|unique|key|constraint|foreign|period\s+for)/i.test(
        line
      )
    );
    const columns = [];
    for (const line of lines) {
      const columnMatch = line.match(
        /^\[?(\w+)\]?\s+([a-zA-Z0-9_]+(?:\s*\([^)]*\))?)([\s\S]*)$/
      );
      if (!columnMatch) continue;
      const [, name, rawTypeFull, rest] = columnMatch;
      const rawType = rawTypeFull.trim();
      const isNullable = !/not\s+null/i.test(rest);
      const isPrimary = /primary\s+key/i.test(rest);
      const isUnique = /unique/i.test(rest);
      const isAutoIncrement = /identity\s*\(\d+,\s*\d+\)/i.test(rest);
      const commentMatch = rest.match(/--\s*(.+)$|comment\s+['"]([^'"]+)['"]/i);
      const comment = commentMatch ? commentMatch[1] || commentMatch[2] : void 0;
      const defaultMatch = rest.match(/default\s+(.+?)(?:\s|,|$)/i);
      const defaultValue = defaultMatch ? defaultMatch[1].replace(/^['"]|['"]$/g, "") : void 0;
      const lengthMatch = rawType.match(/\w+\((\d+)\)/);
      const length = lengthMatch ? parseInt(lengthMatch[1], 10) : void 0;
      const precisionScaleMatch = rawType.match(/\w+\((\d+),\s*(\d+)\)/);
      const precision = precisionScaleMatch ? parseInt(precisionScaleMatch[1], 10) : void 0;
      const scale = precisionScaleMatch ? parseInt(precisionScaleMatch[2], 10) : void 0;
      columns.push({
        name,
        rawType,
        isNullable,
        comment,
        enumValues: void 0,
        length,
        precision,
        scale,
        defaultValue,
        isPrimary,
        isUnique,
        isAutoIncrement
      });
    }
    tables.push({ name: tableName, columns });
  }
  return tables;
}
var init_sqlserver = __esm({
  "src/sqlserver.ts"() {
    init_generate_interface_name();
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  generateForAthena: () => generate,
  generateForBigquery: () => generate2,
  generateForCassandra: () => generate3,
  generateForClickhouse: () => generate4,
  generateForCockroachdb: () => generate5,
  generateForDuckdb: () => generate6,
  generateForFlink: () => generate7,
  generateForHive: () => generate8,
  generateForIbmdb2: () => generate9,
  generateForMariadb: () => generate10,
  generateForMysql: () => generate11,
  generateForNeo4j: () => generate12,
  generateForOracle: () => generate13,
  generateForPostgre: () => generate14,
  generateForPresto: () => generate15,
  generateForRedshift: () => generate16,
  generateForSnowflake: () => generate17,
  generateForSpanner: () => generate18,
  generateForSqlite: () => generate19,
  generateForSqlserver: () => generate20
});
var init_src = __esm({
  "src/index.ts"() {
    init_athena();
    init_bigquery();
    init_cassandra();
    init_clickhouse();
    init_cockroachdb();
    init_duckdb();
    init_flink();
    init_hive();
    init_ibmdb2();
    init_mariadb();
    init_mysql();
    init_neo4j();
    init_oracle();
    init_postgre();
    init_presto();
    init_redshift();
    init_snowflake();
    init_spanner();
    init_sqlite();
    init_sqlserver();
  }
});

// bin/index.ts
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "path";
import * as process from "node:process";

// require("../src/**/*") in bin/index.ts
var globRequire_src = __glob({
  "../src/athena.ts": () => (init_athena(), __toCommonJS(athena_exports)),
  "../src/bigquery.ts": () => (init_bigquery(), __toCommonJS(bigquery_exports)),
  "../src/cassandra.ts": () => (init_cassandra(), __toCommonJS(cassandra_exports)),
  "../src/clickhouse.ts": () => (init_clickhouse(), __toCommonJS(clickhouse_exports)),
  "../src/cockroachdb.ts": () => (init_cockroachdb(), __toCommonJS(cockroachdb_exports)),
  "../src/duckdb.ts": () => (init_duckdb(), __toCommonJS(duckdb_exports)),
  "../src/flink.ts": () => (init_flink(), __toCommonJS(flink_exports)),
  "../src/hive.ts": () => (init_hive(), __toCommonJS(hive_exports)),
  "../src/ibmdb2.ts": () => (init_ibmdb2(), __toCommonJS(ibmdb2_exports)),
  "../src/index.ts": () => (init_src(), __toCommonJS(src_exports)),
  "../src/mariadb.ts": () => (init_mariadb(), __toCommonJS(mariadb_exports)),
  "../src/mysql.ts": () => (init_mysql(), __toCommonJS(mysql_exports)),
  "../src/neo4j.ts": () => (init_neo4j(), __toCommonJS(neo4j_exports)),
  "../src/oracle.ts": () => (init_oracle(), __toCommonJS(oracle_exports)),
  "../src/postgre.ts": () => (init_postgre(), __toCommonJS(postgre_exports)),
  "../src/presto.ts": () => (init_presto(), __toCommonJS(presto_exports)),
  "../src/redshift.ts": () => (init_redshift(), __toCommonJS(redshift_exports)),
  "../src/snowflake.ts": () => (init_snowflake(), __toCommonJS(snowflake_exports)),
  "../src/spanner.ts": () => (init_spanner(), __toCommonJS(spanner_exports)),
  "../src/sqlite.ts": () => (init_sqlite(), __toCommonJS(sqlite_exports)),
  "../src/sqlserver.ts": () => (init_sqlserver(), __toCommonJS(sqlserver_exports)),
  "../src/util/generate-interface-name.ts": () => (init_generate_interface_name(), __toCommonJS(generate_interface_name_exports))
});

// bin/index.ts
var args = process.argv.slice(2);
if (!args[0]) {
  console.error("\u274C No input SQL file specified.");
  process.exit(1);
}
var dbName = (args.includes("-d") ? args[args.indexOf("-d") + 1] : "mysql").toLowerCase();
var input = join(process.cwd(), args[0]);
var output = join(
  process.cwd(),
  args.includes("-o") ? args[args.indexOf("-o") + 1] : `${dbName}.d.ts`
);
if (!existsSync(input)) {
  console.error("\u274C SQL file not found:", input);
  process.exit(1);
}
try {
  const { generate: generateDts } = globRequire_src(`../src/${dbName}`);
  const sql = readFileSync(input, "utf-8");
  const dts = generateDts(sql);
  if (dts) {
    try {
      writeFileSync(output, dts);
    } catch (err) {
      if (err.code === "ENOENT") {
        const dir = dirname(output);
        console.log(`\u26A0\uFE0F Directory not found, creating: ${dir}`);
        mkdirSync(dir, { recursive: true });
        writeFileSync(output, dts);
        console.log(`\u2705 Generated .d.ts saved to: ${output}`);
      } else {
        throw err;
      }
    }
  } else {
    console.log("\u2757 No table found in SQL input.");
  }
} catch (e) {
  console.error(`\u274C Unsupported database type or module not found: ${dbName}`);
  process.exit(1);
}
