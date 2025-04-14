import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForCockroachDB(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForCockroachDB(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(/create\s+table\s+(`?[\w.]+`?)\s*\(([\s\S]+?)\)\s*\)?/gim),
	];

	return tableDefs.map((match) => {
		const [, fullTableName, body] = match;
		const name = fullTableName.replace(/`/g, '');
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(
				/`?(\w+)`?\s+([^\s,]+(?:\([^)]+\))?)(?:\s+(?:not\s+null|null))?(?:\s+default\s+[^,]+)?(?:\s+collate\s+\w+)?(?:\s+comment\s+'([^']*)')?,?/gim,
			),
		];

		for (const [, colName, rawType, comment] of columnMatches) {
			columns.push({
				name: colName,
				type: cockroachTypeToTsType(rawType),
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

function cockroachTypeToTsType(type: string): string {
	let t = type.toLowerCase().trim();

	if (
		t.startsWith('int') ||
		t.startsWith('decimal') ||
		t.startsWith('float') ||
		t === 'serial'
	)
		return 'number';
	if (t.startsWith('bool')) return 'boolean';
	if (
		t.startsWith('varchar') ||
		t.startsWith('char') ||
		t.startsWith('text') ||
		t.startsWith('string')
	)
		return 'string';
	if (
		t.startsWith('timestamp') ||
		t.startsWith('date') ||
		t.startsWith('time') ||
		t === 'interval'
	)
		return 'string';
	if (t === 'uuid') return 'string';
	if (t === 'json' || t === 'jsonb') return 'any';
	if (t === 'inet') return 'string';
	if (t === 'bytes') return 'Uint8Array';
	if (t === 'bit') return 'number';

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
