import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tables = parseSQLForSQLServer(sql);
	return tables.map(generateInterface).join('\n\n');
}

function parseSQLForSQLServer(sql: string): Table[] {
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
				type: sqlServerTypeToTsType(rawType),
				comment: comment?.trim(),
			});
		}

		tables.push({
			name,
			columns,
			indexes: parseIndexesForTable(name, indexDefs), // 解析索引
		});
	}

	return tables;
}

// 解析索引
function parseIndexesForTable(
	tableName: string,
	indexDefs: RegExpMatchArray[],
): Index[] {
	return indexDefs
		.filter(([, , indexTableName]) => indexTableName === tableName) // 筛选属于当前表的索引
		.map(([, indexName, , columns]) => {
			const indexColumns = columns.split(',').map((col) => col.trim());
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
		table.indexes.forEach((index) => {
			lines.push(
				`  ${index.name}: [${index.columns.map((col) => `'${col}'`).join(', ')}],`,
			);
		});
		lines.push('};');
	}

	return lines.join('\n');
}

function sqlServerTypeToTsType(type: string): string {
	let t = type.toLowerCase().trim();

	// SQL Server 常见类型
	if (t === 'int' || t === 'bigint' || t === 'smallint' || t === 'tinyint')
		return 'number';
	if (t === 'varchar' || t === 'char' || t === 'text' || t === 'nvarchar')
		return 'string';
	if (t === 'bit') return 'boolean';
	if (t === 'datetime' || t === 'smalldatetime' || t === 'timestamp')
		return 'string';
	if (t === 'decimal' || t === 'numeric' || t === 'float' || t === 'real')
		return 'number';
	if (t === 'uniqueidentifier') return 'string';
	if (t === 'binary' || t === 'varbinary') return 'Buffer';
	if (t === 'money' || t === 'smallmoney') return 'number';

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
