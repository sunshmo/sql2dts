import { generateInterfaceName } from './util/generate-interface-name';

// Redshift 数据类型映射到 TypeScript 类型
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

	// Redshift 数值类型
	if (
		/smallint|integer|bigint|decimal|numeric|real|double\s+precision/.test(type)
	)
		return 'number';

	// Redshift 字符类型
	if (/char|varchar|text/.test(type)) return 'string';

	// Redshift 布尔类型
	if (/boolean/.test(type)) return 'boolean';

	// Redshift 二进制类型
	if (/bytea/.test(type)) return 'Buffer';

	// Redshift 日期时间类型
	if (/date|time|timestamp/.test(type)) return 'string';

	// Redshift JSON 类型
	if (/json|jsonb/.test(type)) return 'Record<string, any>';

	// Redshift UUID 类型
	if (/uuid/.test(type)) return 'string';

	// Redshift 数组类型
	if (/ARRAY/.test(type)) {
		const arrayTypeMatch = type.match(/ARRAY\[(.+)\]/);
		if (arrayTypeMatch) {
			return `${mapType(arrayTypeMatch[1], undefined, udtTypeMapping)}[]`;
		}
	}

	// 默认返回 any 类型
	return 'any';
}

// 生成 TypeScript 类型定义
export function generate(
	sql: string,
	options?: { namespace?: string },
	udtTypeMapping: Record<string, string> = {},
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
			const tsType = mapType(column.rawType, column.enumValues, udtTypeMapping);
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
}

interface ParsedTable {
	name: string;
	columns: ParsedColumn[];
}

// 解析 Redshift SQL
function parseSQL(sql: string): ParsedTable[] {
	// 排除非 CREATE TABLE 语句
	if (!/create\s+table/i.test(sql)) return [];

	// Redshift CREATE TABLE 语法解析，忽略 schema，提取表名和列定义
	const tableBlocks = [
		...sql.matchAll(
			/create\s+table\s+(?:("[^"]+"|\w+)\.)?("?[\w$]+"?)\s*\(([\s\S]+?)\)\s*(?:with|on|;)?/gim,
		),
	];

	const tables: ParsedTable[] = [];

	for (const [, /* schema */ , tableName, rawColumns] of tableBlocks) {
		const lines = rawColumns
			.split(/,(?![^()]*\))/) // 忽略括号内的逗号
			.map((line) => line.trim())
			.filter(
				(line) =>
					!!line &&
					!/^(primary\s+key|unique|key|constraint|foreign|partition\s+by)/i.test(
						line,
					), // 排除主键、唯一约束等
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
