import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForSpanner(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForSpanner(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(
			/create\s+table\s+([\w.]+)\s*\(([\s\S]+?)\)\s*(primary\s+key|\))/gim,
		),
	];

	return tableDefs.map((match) => {
		const [, fullTableName, body] = match;
		const name = fullTableName.replace(/["]/g, '');
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(
				/(\w+)\s+([^\s,]+)(?:\s+not\s+null)?(?:\s+options\s*\(\s*comment\s*=\s*'([^']*)'\s*\))?,?/gim,
			),
		];
		for (const [, colName, rawType, comment] of columnMatches) {
			columns.push({
				name: colName,
				type: spannerTypeToTsType(rawType),
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

function spannerTypeToTsType(type: string): string {
	let t = type.toLowerCase().trim();

	// ARRAY<T>
	const arrayMatch = t.match(/^array<(.+)>$/i);
	if (arrayMatch) {
		return `${spannerTypeToTsType(arrayMatch[1])}[]`;
	}

	if (t === 'int64' || t === 'float64' || t === 'numeric') return 'number';
	if (t === 'bool') return 'boolean';
	if (t === 'string' || t === 'json') return 'string';
	if (t === 'date' || t.startsWith('timestamp')) return 'string';
	if (t === 'bytes') return 'Buffer';

	return 'any';
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
