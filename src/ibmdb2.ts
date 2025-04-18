import { generateInterfaceName } from './util/generate-interface-name';

function mapType(
	rawType: string,
	enumValues?: string[],
	udtTypeMapping: Record<string, string> = {},
): string {
	if (enumValues?.length) {
		return enumValues.map((v) => `'${v}'`).join(' | ');
	}

	let type = rawType.toLowerCase();

	// 清理 FOR BIT DATA 等后缀
	type = type.replace(/\s+for\s+bit\s+data/, '');

	// 如果是用户自定义类型，使用映射表
	if (udtTypeMapping[type]) {
		return udtTypeMapping[type];
	}

	// 支持数组类型
	if (/array<.*>/i.test(type)) {
		const match = type.match(/^array<(.*)>/i);
		if (match) {
			const innerType = mapType(match[1]);
			return `${innerType}[]`;
		}
	}

	// 支持 Map 类型
	if (/map<.*,.*/i.test(type)) {
		const match = type.match(/^map<([^,]+),\s*(.*)>/i);
		if (match) {
			const keyType = mapType(match[1]);
			const valueType = mapType(match[2]);
			return `Record<${keyType}, ${valueType}>`;
		}
	}

	// 支持 Struct 类型
	if (/struct<.*>/i.test(type)) {
		const match = type.match(/^struct<(.*)>/i);
		if (match) {
			const fields = match[1]
				.split(',')
				.map((field) => field.trim())
				.map((field) => {
					const [name, fieldType] = field.split(':').map((part) => part.trim());
					return `${name}: ${mapType(fieldType)}`;
				})
				.join('; ');
			return `{ ${fields} }`;
		}
	}

	// 基本类型映射
	if (/tinyint|smallint|mediumint|int|bigint|integer/.test(type))
		return 'number';
	if (/decimal|numeric|decfloat|real|double/.test(type)) return 'number';
	if (/char|nchar|nvarchar|varchar|graphic|vargraphic|clob|dbclob/.test(type))
		return 'string';
	if (/binary|varbinary|blob/.test(type)) return 'Buffer';
	if (/date|time|timestamp/.test(type)) return 'string';
	if (/boolean|bool/.test(type)) return 'boolean';
	if (/rowid|uuid|uniqueidentifier/.test(type)) return 'string';
	if (/xml/.test(type)) return 'string';
	if (/json/.test(type)) return 'Record<string, any>';
	if (/cursor/.test(type)) return 'any';
	if (/st_point|st_linestring|st_polygon|st_geometry/.test(type))
		return 'string'; // 空间类型

	return 'any';
}

export function generate(
	sql: string,
	options?: { namespace?: string },
): string {
	const tables: ParsedTable[] = parseSQL(sql);
	const lines: string[] = [];

	if (options?.namespace) {
		lines.push(`declare namespace ${options.namespace} {`);
	}

	for (const table of tables) {
		const interfaceLine = `${options?.namespace ? '' : 'export '}interface ${generateInterfaceName(table.name)} {`;
		lines.push(interfaceLine);

		for (const column of table.columns) {
			const tsType = mapType(column.rawType, column.enumValues);
			const optional =
				column.isNullable || column.defaultValue !== undefined ? '?' : '';
			const comment = column.comment ? ` // ${column.comment}` : '';
			lines.push(`  ${column.name}${optional}: ${tsType};${comment}`);
		}

		lines.push('}');
		lines.push('');
	}

	if (options?.namespace) {
		lines.push('}');
	}

	return lines.join('\n');
}

interface ParsedColumn {
	name: string;
	rawType: string;
	isNullable: boolean;
	comment?: string;
	enumValues?: string[];
	length?: number;
	precision?: number;
	scale?: number;
	defaultValue?: string;
	isPrimary?: boolean;
	isUnique?: boolean;
	isAutoIncrement?: boolean;
}

interface ParsedTable {
	name: string;
	columns: ParsedColumn[];
}

function parseSQL(sql: string): ParsedTable[] {
	// 排除临时表、视图、存储过程、序列等
	if (!/create\s+table/i.test(sql)) return [];

	// 支持 DB2 的 CREATE TABLE，忽略 schema，如 dbname.table → table
	const tableBlocks = [
		...sql.matchAll(
			/create\s+table\s+(?:("[^"]+"|\w+)\.)?("?[\w$]+"?)\s*\(([\s\S]+?)\)\s*(?:partition\s+by|organize\s+by|with|compress|data\s+initially|;)?/gim,
		),
	];

	const tables: ParsedTable[] = [];

	for (const [, /*schema*/ , tableName, rawColumns] of tableBlocks) {
		const lines = rawColumns
			.split(/,(?![^()]*\))/) // 忽略括号内逗号（如 DECIMAL(10, 2)）
			.map((line) => line.trim())
			.filter(
				(line) =>
					!!line &&
					!/^(primary\s+key|unique|key|constraint|foreign|period\s+for|partition\s+by)/i.test(
						line,
					),
			);

		const columns: ParsedColumn[] = [];

		for (const line of lines) {
			const columnMatch = line.match(
				/^("?[\w$]+"?)\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?(?:\s+FOR\s+BIT\s+DATA)?)([\s\S]*)$/i,
			);
			if (!columnMatch) continue;

			const [, rawName, rawTypeFull, rest] = columnMatch;

			const name = rawName.replace(/(^"|"$)/g, '');
			const rawType = rawTypeFull.trim();

			const isNullable = !/not\s+null/i.test(rest);
			const isPrimary = /primary\s+key/i.test(rest);
			const isUnique = /unique/i.test(rest);
			const isAutoIncrement = /generated\s+always\s+as\s+identity/i.test(rest);
			const commentMatch = rest.match(/--\s*(.+)$/);
			const comment = commentMatch ? commentMatch[1] : undefined;

			const defaultMatch = rest.match(/default\s+(.+?)(?:[\s,]|$)/i);
			const defaultValue = defaultMatch
				? defaultMatch[1].replace(/^['"]|['"]$/g, '')
				: undefined;

			columns.push({
				name,
				rawType,
				isNullable,
				comment,
				defaultValue,
				isPrimary,
				isUnique,
				isAutoIncrement,
			});
		}

		tables.push({ name: tableName, columns });
	}

	return tables;
}
