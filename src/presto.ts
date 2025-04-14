import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForPresto(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForPresto(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(
			/create\s+table\s+([\w."]+)\s*\(([\s\S]+?)\)\s*(comment\s+|with\s*\(|as\s+select|location\s+)?/gim,
		),
	];

	return tableDefs.map((match) => {
		const [, fullTableName, body] = match;
		const name = fullTableName.replace(/["]/g, '');
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(/"?(\w+)"?\s+([^\s,]+)(?:\s+comment\s+'([^']*)')?,?/gim),
		];
		for (const [, colName, rawType, comment] of columnMatches) {
			columns.push({
				name: colName,
				type: prestoTypeToTsType(rawType),
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

function prestoTypeToTsType(type: string): string {
	let t = type.toLowerCase().trim();

	// Array<T>
	const arrayMatch = t.match(/^array\((.+)\)$/i);
	if (arrayMatch) {
		return `${prestoTypeToTsType(arrayMatch[1])}[]`;
	}

	// Map<K,V>
	const mapMatch = t.match(/^map\(([^,]+),\s*(.+)\)$/i);
	if (mapMatch) {
		const [_, k, v] = mapMatch;
		return `{ [key: ${prestoTypeToTsType(k)}]: ${prestoTypeToTsType(v)} }`;
	}

	// Row<T1 name1, T2 name2, ...>
	const rowMatch = t.match(/^row\s*\((.+)\)$/i);
	if (rowMatch) {
		const fields = splitTopLevelArgs(rowMatch[1]);
		return `{ ${fields
			.map((f) => {
				const parts = f.trim().split(/\s+/);
				const fname = parts.pop();
				const ftype = parts.join(' ');
				return `${fname}: ${prestoTypeToTsType(ftype)}`;
			})
			.join('; ')} }`;
	}

	// Simple types
	if (
		t.startsWith('int') ||
		t === 'double' ||
		t === 'real' ||
		t === 'decimal' ||
		t === 'bigint' ||
		t === 'smallint' ||
		t === 'tinyint'
	)
		return 'number';
	if (t === 'varchar' || t === 'char' || t === 'string') return 'string';
	if (t === 'boolean') return 'boolean';
	if (t === 'date' || t.startsWith('timestamp') || t === 'time')
		return 'string';

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
