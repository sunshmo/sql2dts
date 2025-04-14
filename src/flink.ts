import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForFlink(sql);
	return tables.map((table) => generateInterface(table)).join('\n\n');
}

function parseSQLForFlink(sql: string) {
	const tableBlocks = [
		...sql.matchAll(
			/create\s+(temporary\s+)?(table|view)\s+`?(\w+(?:\.\w+)?)`?\s*\(([\s\S]+?)\)\s*(with|partitioned|comment|primary|foreign|not\s+null|unique|watermark|as|stored|tblproperties)?/gim,
		),
	];

	return tableBlocks.map((match) => {
		const [, , type, name, body] = match;
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(
				/`?(\w+)`?\s+([^\s,]+(?:<[^>]+>)?)\s*(?:as\s+[^,]+)?(?:\s+comment\s+'([^']*)')?/gim,
			),
		];
		for (const [, columnName, rawType, comment] of columnMatches) {
			columns.push({
				name: columnName,
				type: flinkTypeToTsType(rawType),
				comment: comment?.trim(),
			});
		}

		return {
			name,
			type,
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

function flinkTypeToTsType(flinkType: string): string {
	const type = flinkType.toLowerCase();
	if (
		type.startsWith('varchar') ||
		type.startsWith('char') ||
		type.startsWith('string')
	)
		return 'string';
	if (type.startsWith('boolean')) return 'boolean';
	if (
		type.startsWith('tinyint') ||
		type.startsWith('smallint') ||
		type.startsWith('int') ||
		type.startsWith('bigint') ||
		type.startsWith('float') ||
		type.startsWith('double') ||
		type.startsWith('decimal') ||
		type.startsWith('numeric')
	)
		return 'number';
	if (
		type.startsWith('date') ||
		type.startsWith('time') ||
		type.startsWith('timestamp')
	)
		return 'string';
	if (type.startsWith('binary') || type.startsWith('bytes')) return 'Buffer';
	if (type.startsWith('array<'))
		return `${flinkTypeToTsType(type.slice(6, -1))}[]`;
	if (type.startsWith('map<')) {
		const [k, v] = splitMapKeyValue(type.slice(4, -1));
		return `{ [key: ${flinkTypeToTsType(k)}]: ${flinkTypeToTsType(v)} }`;
	}
	if (type.startsWith('multiset<'))
		return `${flinkTypeToTsType(type.slice(9, -1))}[]`;
	if (type.startsWith('row<')) {
		const inner = type.slice(4, -1);
		const fields = inner.split(/\s*,\s*(?![^<]*>)/).map((f) => {
			const [key, ...rest] = f.trim().split(/\s+/);
			return `${key}: ${flinkTypeToTsType(rest.join(' '))}`;
		});
		return `{ ${fields.join('; ')} }`;
	}
	return 'any';
}

function splitMapKeyValue(str: string): [string, string] {
	const parts = [];
	let depth = 0;
	let current = '';
	for (const char of str) {
		if (char === '<') depth++;
		if (char === '>') depth--;
		if (char === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	parts.push(current.trim());
	return [parts[0], parts[1]];
}

interface Column {
	name: string;
	type: string;
	comment?: string;
}

interface Table {
	name: string;
	type: string;
	columns: Column[];
}
