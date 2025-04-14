import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForDuckDB(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForDuckDB(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(/create\s+table\s+(`?[\w.]+`?)\s*\(([^;]+?)\)/gim),
	];

	return tableDefs.map((match) => {
		const [, fullTableName, body] = match;
		const name = fullTableName.replace(/`/g, '');
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(
				/`?(\w+)`?\s+([^\s,]+(?:\([^)]*\))?)\s*(?:--\s*(.*))?,?/gim,
			),
		];
		for (const [, colName, rawType, comment] of columnMatches) {
			columns.push({
				name: colName,
				type: duckdbTypeToTsType(rawType),
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

function duckdbTypeToTsType(type: string): string {
	const t = type.toLowerCase().trim();

	if (
		t.startsWith('int') ||
		t.startsWith('decimal') ||
		t === 'float' ||
		t === 'double'
	)
		return 'number';
	if (t === 'bool' || t === 'boolean') return 'boolean';
	if (t.startsWith('varchar') || t === 'text' || t === 'string')
		return 'string';
	if (t === 'date' || t === 'timestamp' || t.startsWith('timestamp'))
		return 'string';
	if (t === 'blob') return 'Uint8Array';

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
