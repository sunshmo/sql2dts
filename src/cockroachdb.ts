import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForCockroachDB(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForCockroachDB(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(
			/create\s+table\s+(`?[\w.]+`?)\s*\(([\s\S]+?)\)\s*(index\s+.*|primary\s+key\s+.*)?/gim,
		),
	];

	return tableDefs.map((match) => {
		const [, fullTableName, body, indexDef] = match;
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

		const indexes = parseIndexes(indexDef);

		return {
			name,
			columns,
			indexes,
		};
	});
}

function parseIndexes(indexDef: string | undefined): Index[] {
	if (!indexDef) return [];

	const indexMatches = [
		...indexDef.matchAll(
			/create\s+index\s+(\w+)\s+on\s+`?[\w.]+`?\s*\(([^)]+)\)/gim,
		),
	];

	return indexMatches.map((match) => {
		const [, indexName, columns] = match;
		return {
			name: indexName,
			columns: columns.split(',').map((col) => col.trim()),
		};
	});
}

function generateInterface(table: Table): string {
	const interfaceName = generateInterfaceName(table.name);
	const lines: string[] = [];

	if (table.indexes.length > 0) {
		lines.push(`/**`);
		table.indexes.forEach((index) => {
			lines.push(` * Index: ${index.name} (${index.columns.join(', ')})`);
		});
		lines.push(` */`);
	}

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
	indexes: Index[];
}

interface Index {
	name: string;
	columns: string[];
}
