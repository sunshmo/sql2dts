import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForSnowflake(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForSnowflake(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(
			/create\s+(or\s+replace\s+)?table\s+(`?[\w.]+`?)\s*\(([^;]+?)\)\s*(comment|cluster|with|as)?/gim,
		),
	];

	return tableDefs.map((match) => {
		const [, , fullTableName, body] = match;
		const name = fullTableName.replace(/`/g, '');
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(
				/`?(\w+)`?\s+([^\s,]+(?:\([^)]*\))?)\s*(?:comment\s+'([^']*)')?,?/gim,
			),
		];
		for (const [, colName, rawType, comment] of columnMatches) {
			columns.push({
				name: colName,
				type: snowflakeTypeToTsType(rawType),
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

function snowflakeTypeToTsType(type: string): string {
	let t = type.toLowerCase().trim();

	if (
		t === 'string' ||
		t.startsWith('varchar') ||
		t.startsWith('char') ||
		t === 'text'
	)
		return 'string';
	if (
		t.startsWith('number') ||
		t.startsWith('decimal') ||
		t.startsWith('numeric') ||
		t.startsWith('int') ||
		t.startsWith('double') ||
		t.startsWith('float')
	)
		return 'number';
	if (t === 'boolean') return 'boolean';
	if (
		t.startsWith('timestamp') ||
		t === 'date' ||
		t === 'datetime' ||
		t === 'time'
	)
		return 'string';
	if (t === 'variant' || t === 'object') return 'Record<string, any>';
	if (t === 'array') return 'any[]';

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
