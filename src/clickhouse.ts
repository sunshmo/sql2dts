import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForClickHouse(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForClickHouse(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(
			/create\s+table\s+(`?[\w.]+`?)\s*\(([\s\S]+?)\)\s*((?:engine|comment|settings)[\s\S]*?)(?:;|$)/gim,
		),
	];

	return tableDefs.map((match) => {
		const [, fullTableName, body, suffix] = match;
		const name = fullTableName.replace(/`/g, '').split('.').pop()!;
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(
				/`?(\w+)`?\s+([^\s,]+(?:\([^)]*\))?(?:\s*\([^)]+\))?)\s*(?:default\s+([^,\s]+))?(?:\s+not\s+null)?\s*(?:comment\s+'([^']*)')?,?/gim,
			),
		];

		for (const [, colName, rawType, defaultVal, comment] of columnMatches) {
			columns.push({
				name: colName,
				type: clickhouseTypeToTsType(rawType),
				comment: comment?.trim(),
				default: defaultVal?.trim(),
			});
		}

		const engine = suffix?.match(/engine\s*=\s*([^\s\(\n]+)/i)?.[1];
		const orderBy = suffix?.match(/order\s+by\s*\(([^)]+)\)/i)?.[1];
		const primaryKey = suffix?.match(/primary\s+key\s*\(([^)]+)\)/i)?.[1];
		const settings = suffix?.match(/settings\s+([^\n;]+)/i)?.[1];
		const tableComment = suffix?.match(/comment\s+'([^']+)'/i)?.[1];

		return {
			name,
			columns,
			engine,
			orderBy,
			primaryKey,
			settings,
			comment: tableComment?.trim(),
		};
	});
}

function generateInterface(table: Table): string {
	const interfaceName = generateInterfaceName(table.name);
	const lines: string[] = [];

	if (table.comment || table.engine || table.orderBy || table.primaryKey || table.settings) {
		lines.push(`/**`);
		if (table.comment) lines.push(` * ${table.comment}`);
		if (table.engine) lines.push(` * ENGINE = ${table.engine}`);
		if (table.orderBy) lines.push(` * ORDER BY (${table.orderBy})`);
		if (table.primaryKey) lines.push(` * PRIMARY KEY (${table.primaryKey})`);
		if (table.settings) lines.push(` * SETTINGS ${table.settings}`);
		lines.push(` */`);
	}

	lines.push(`export interface ${interfaceName} {`);
	for (const col of table.columns) {
		const commentParts = [];
		if (col.comment) commentParts.push(col.comment);
		if (col.default) commentParts.push(`default: ${col.default}`);
		const comment = commentParts.length ? ` // ${commentParts.join(', ')}` : '';
		lines.push(`  ${col.name}: ${col.type};${comment}`);
	}
	lines.push(`}`);

	return lines.join('\n');
}

function clickhouseTypeToTsType(type: string): string {
	let t = type.toLowerCase().trim();

	// Nullable(T)
	if (t.startsWith('nullable(')) {
		return `${clickhouseTypeToTsType(t.slice(9, -1))} | null`;
	}

	// Array(T)
	if (t.startsWith('array(')) {
		return `${clickhouseTypeToTsType(t.slice(6, -1))}[]`;
	}

	// Map(K, V)
	const mapMatch = t.match(/^map\(([^,]+),\s*(.+)\)$/i);
	if (mapMatch) {
		const [, k, v] = mapMatch;
		return `{ [key: ${clickhouseTypeToTsType(k)}]: ${clickhouseTypeToTsType(v)} }`;
	}

	// Tuple(T1, T2, ...)
	if (t.startsWith('tuple(')) {
		const fields = splitTopLevelArgs(t.slice(6, -1));
		return `[${fields.map((f) => clickhouseTypeToTsType(f)).join(', ')}]`;
	}

	// LowCardinality(T)
	if (t.startsWith('lowcardinality(')) {
		return clickhouseTypeToTsType(t.slice(15, -1));
	}

	// Enum
	if (t.startsWith('enum')) return 'string';

	// Number types
	if (
		t.startsWith('int') ||
		t.startsWith('uint') ||
		t.startsWith('float') ||
		t.startsWith('decimal')
	)
		return 'number';

	// String types
	if (
		t === 'string' ||
		t.startsWith('fixedstring') ||
		t === 'uuid' ||
		t.startsWith('datetime') ||
		t === 'date'
	)
		return 'string';

	// Boolean
	if (t === 'boolean') return 'boolean';

	return 'any';
}

function splitTopLevelArgs(str: string): string[] {
	const args: string[] = [];
	let depth = 0;
	let current = '';
	for (const char of str) {
		if (char === '(') depth++;
		if (char === ')') depth--;
		if (char === ',' && depth === 0) {
			args.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	if (current.trim()) args.push(current.trim());
	return args;
}

interface Column {
	name: string;
	type: string;
	comment?: string;
	default?: string;
}

interface Table {
	name: string;
	columns: Column[];
	comment?: string;
	engine?: string;
	orderBy?: string;
	primaryKey?: string;
	settings?: string;
}
