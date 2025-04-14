import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForCassandra(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForCassandra(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(
			/create\s+table\s+(if\s+not\s+exists\s+)?(`?[\w.]+`?)\s*\(([\s\S]+?)\)\s*(with\s+.*)?;/gim,
		),
	];

	return tableDefs.map((match) => {
		const [, , fullTableName, body] = match;
		const name = fullTableName.replace(/`/g, '');
		const columns: Column[] = [];

		const columnMatches = [
			...body.matchAll(
				/`?(\w+)`?\s+([^\s,]+)(?:\s+static)?(?:\s+primary\s+key)?(?:,|\))/gim,
			),
		];
		for (const [, colName, rawType] of columnMatches) {
			columns.push({
				name: colName,
				type: cassandraTypeToTsType(rawType),
				isPrimaryKey: /primary\s+key/i.test(body),
				isStatic: /static/i.test(body),
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
		const optional = col.isPrimaryKey ? '' : '?'; // Primary key can't be optional
		lines.push(`  ${col.name}${optional}: ${col.type};`);
	}
	lines.push(`}`);

	return lines.join('\n');
}

function cassandraTypeToTsType(type: string): string {
	let t = type.trim().toLowerCase();

	// frozen<T>
	const frozenMatch = t.match(/^frozen<(.+)>$/i);
	if (frozenMatch) {
		return cassandraTypeToTsType(frozenMatch[1]);
	}

	// tuple<T1, T2, ...>
	const tupleMatch = t.match(/^tuple<(.+)>$/i);
	if (tupleMatch) {
		const fields = splitTopLevelArgs(tupleMatch[1]);
		return `[${fields.map((f) => cassandraTypeToTsType(f)).join(', ')}]`;
	}

	// list<T>, set<T>
	const listMatch = t.match(/^(list|set)<(.+)>$/i);
	if (listMatch) {
		return `${cassandraTypeToTsType(listMatch[2])}[]`;
	}

	// map<K, V>
	const mapMatch = t.match(/^map<([^,]+),\s*(.+)>$/i);
	if (mapMatch) {
		const [, k, v] = mapMatch;
		return `{ [key: ${cassandraTypeToTsType(k)}]: ${cassandraTypeToTsType(v)} }`;
	}

	// base types
	if (
		[
			'int',
			'bigint',
			'varint',
			'smallint',
			'tinyint',
			'decimal',
			'double',
			'float',
			'counter',
		].includes(t)
	) {
		return 'number';
	}
	if (['text', 'varchar', 'ascii', 'inet', 'uuid', 'timeuuid'].includes(t)) {
		return 'string';
	}
	if (['boolean'].includes(t)) {
		return 'boolean';
	}
	if (['timestamp', 'date', 'time'].includes(t)) {
		return 'string'; // ISO timestamp
	}
	if (t === 'blob') return 'Buffer';

	return 'any';
}

function splitTopLevelArgs(str: string): string[] {
	const args: string[] = [];
	let depth = 0;
	let current = '';
	for (const char of str) {
		if (char === '<') depth++;
		if (char === '>') depth--;
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
	isPrimaryKey?: boolean;
	isStatic?: boolean;
}

interface Table {
	name: string;
	columns: Column[];
}
