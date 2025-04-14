import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForClickHouse(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForClickHouse(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(
			/create\s+table\s+(`?[\w.]+`?)\s*\(([\s\S]+?)\)\s*(engine\s+.*|comment\s+'.*'|settings\s+.*)?/gim,
		),
	];

	return tableDefs.map((match) => {
		const [, fullTableName, body] = match;
		const name = fullTableName.replace(/`/g, '');
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(
				/`?(\w+)`?\s+([^\s,]+(?:\([^)]*\))?(?:\s*\([^)]+\))?)\s*(?:comment\s+'([^']*)')?,?/gim,
			),
		];
		for (const [, colName, rawType, comment] of columnMatches) {
			columns.push({
				name: colName,
				type: clickhouseTypeToTsType(rawType),
				comment: comment?.trim(),
			});
		}

		return {
			name,
			columns,
		};
	});
}

function generateInterface(table: Table): string {
	const interfaceName = generateInterfaceName(table.name);
	const lines: string[] = [];

	lines.push(`export interface ${interfaceName} {`);
	for (const col of table.columns) {
		const comment = col.comment ? ` // ${col.comment}` : '';
		lines.push(`  ${col.name}: ${col.type};${comment}`);
	}
	lines.push(`}`);

	return lines.join('\n');
}

function clickhouseTypeToTsType(type: string): string {
	let t = type.toLowerCase().trim();

	// Nullable(T)
	const nullableMatch = t.match(/^nullable\((.+)\)$/i);
	if (nullableMatch) {
		return `${clickhouseTypeToTsType(nullableMatch[1])} | null`;
	}

	// Array(T)
	const arrayMatch = t.match(/^array\((.+)\)$/i);
	if (arrayMatch) {
		return `${clickhouseTypeToTsType(arrayMatch[1])}[]`;
	}

	// Map(K, V)
	const mapMatch = t.match(/^map\(([^,]+),\s*(.+)\)$/i);
	if (mapMatch) {
		const [_, k, v] = mapMatch;
		return `{ [key: ${clickhouseTypeToTsType(k)}]: ${clickhouseTypeToTsType(v)} }`;
	}

	// Tuple(T1, T2, ...)
	const tupleMatch = t.match(/^tuple\((.+)\)$/i);
	if (tupleMatch) {
		const fields = splitTopLevelArgs(tupleMatch[1]);
		return `[${fields.map((f) => clickhouseTypeToTsType(f)).join(', ')}]`;
	}

	// Simple type mapping
	if (
		t.startsWith('int') ||
		t.startsWith('uint') ||
		t === 'float32' ||
		t === 'float64' ||
		t === 'decimal'
	)
		return 'number';
	if (t === 'string' || t === 'fixedstring') return 'string';
	if (t === 'datetime' || t === 'date' || t.startsWith('datetime64'))
		return 'string';
	if (t === 'uuid') return 'string';
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
}

interface Table {
	name: string;
	columns: Column[];
}
