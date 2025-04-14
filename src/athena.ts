import { generateInterfaceName } from './util/generate-interface-name';

// Athena 数据类型映射到 TypeScript 类型
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

	// Athena 数值类型
	if (/int64|float64|numeric|bignumeric/.test(type)) return 'number';

	// Athena 字符类型
	if (/string/.test(type)) return 'string';
	if (/bytes/.test(type)) return 'Buffer';

	// Athena 布尔类型
	if (/bool/.test(type)) return 'boolean';

	// Athena 日期时间类型
	if (/date/.test(type)) return 'string'; // Athena 的 DATE 是 string 格式
	if (/datetime/.test(type)) return 'string'; // Athena 的 DATETIME 是 string 格式
	if (/timestamp/.test(type)) return 'string'; // Athena 的 TIMESTAMP 是 string 格式
	if (/time/.test(type)) return 'string'; // Athena 的 TIME 是 string 格式

	// Athena JSON 类型
	if (/json/.test(type)) return 'Record<string, any>';

	// Athena 结构化类型
	if (/struct/.test(type)) return 'Record<string, any>';

	// Athena 数组类型
	if (/array/.test(type)) return 'any[]';

	// 默认返回 any 类型
	return 'any';
}

// 生成 TypeScript 类型定义
export function generate(
	sql: string,
	options?: { namespace?: string },
): string {
	const tables = parseSQL(sql);
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

// 表和列结构的定义
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
	isNotNull?: boolean;
	isPrimaryKey?: boolean;
	withOptions?: Record<string, any>;
}

interface ParsedTable {
	name: string;
	columns: ParsedColumn[];
}

function parseSQL(sql: string): ParsedTable[] {
	const tables: ParsedTable[] = [];

	const tableBlocks = [
		...sql.matchAll(
			/create\s+(external\s+)?table\s+(`?[\w.-]+`?)\s*\(([\s\S]+?)\)\s*(row format|stored as|location|tblproperties|partitioned by|with serdeproperties|;)?/gim,
		),
	];

	for (const [, , tableName, rawColumns] of tableBlocks) {
		const columnLines = rawColumns
			.split(/,(?![^<]*>)/) // 支持 array<...>, struct<...> 内逗号
			.map((line) => line.trim())
			.filter(
				(line) =>
					!!line &&
					!/^partitioned\s+by/i.test(line) &&
					!/^row format|stored as|location|tblproperties|with serdeproperties/i.test(
						line,
					),
			);

		const columns: ParsedColumn[] = [];

		for (const line of columnLines) {
			const match = line.match(
				/^`?([\w-]+)`?\s+([a-zA-Z0-9_<>(),]+)(\s+comment\s+['"](.+?)['"])?(\s+default\s+['"](.+?)['"])?\s*(not\s+null)?\s*(primary\s+key)?/i,
			);
			if (!match) continue;

			const [, name, rawType, , comment, , defaultValue, , isPrimaryKey] =
				match;

			columns.push({
				name,
				rawType,
				isNullable: !/not\s+null/i.test(line),
				comment,
				defaultValue,
				isPrimaryKey: !!isPrimaryKey,
			});
		}

		tables.push({ name: tableName, columns });
	}

	return tables;
}
