import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForSQLite(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForSQLite(sql: string): Table[] {
	const tableDefs = [
		...sql.matchAll(
			/create\s+table\s+([\w.]+)\s*\(([\s\S]+?)\)\s*(?:;|--|\n)/gim,
		),
	];

	const indexDefs = [
		...sql.matchAll(
			/create\s+index\s+([\w.]+)\s+on\s+([\w.]+)\s*\(([\w\s,]+)\)/gim,
		),
	];

	const tables: Table[] = [];

	// 解析表结构
	for (const match of tableDefs) {
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
				type: sqliteTypeToTsType(rawType),
				comment: comment?.trim(),
			});
		}

		tables.push({
			name,
			columns,
			indexes: parseIndexesForTable(name, indexDefs),  // 解析索引
		});
	}

	return tables;
}

// 解析索引
function parseIndexesForTable(tableName: string, indexDefs: RegExpMatchArray[]): Index[] {
	return indexDefs
		.filter(([, , indexTableName]) => indexTableName === tableName) // 筛选属于当前表的索引
		.map(([, indexName, , columns]) => {
			const indexColumns = columns.split(',').map(col => col.trim());
			return {
				name: indexName,
				columns: indexColumns,
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

	// 处理索引
	if (table.indexes.length > 0) {
		lines.push('');
		lines.push('export const indexes = {');
		table.indexes.forEach(index => {
			lines.push(`  ${index.name}: [${index.columns.map(col => `'${col}'`).join(', ')}],`);
		});
		lines.push('};');
	}

	return lines.join('\n');
}

function sqliteTypeToTsType(type: string): string {
	let t = type.toLowerCase().trim();

	// 处理数组类型：ARRAY<T>
	const arrayMatch = t.match(/^array<(.+)>$/i);
	if (arrayMatch) {
		return `${sqliteTypeToTsType(arrayMatch[1])}[]`;
	}

	// SQLite 常见类型
	if (t === 'integer') return 'number';
	if (t === 'text' || t === 'varchar' || t === 'char') return 'string';
	if (t === 'blob') return 'Buffer';
	if (t === 'real' || t === 'float' || t === 'double') return 'number';
	if (t === 'boolean') return 'boolean';

	// 默认返回 any
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
