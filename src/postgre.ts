import { generateInterfaceName } from './util/generate-interface-name';

// PostgreSQL 特有类型映射
function mapType(rawType: string, enumValues?: string[]): string {
	if (enumValues?.length) {
		return enumValues.map((v) => `'${v}'`).join(' | ');
	}

	const type = rawType.toLowerCase();
	if (/serial|bigserial/.test(type)) return 'number'; // SERIAL 和 BIGSERIAL 类型映射为 number
	if (/uuid/.test(type)) return 'string'; // UUID 类型映射为 string
	if (/json|jsonb/.test(type)) return 'any'; // JSON 和 JSONB 类型映射为 any
	if (/interval/.test(type)) return 'string'; // INTERVAL 类型映射为 string
	if (/timestamp|date/.test(type)) return 'string'; // timestamp 和 date 类型映射为 string
	if (/varchar|char|text/.test(type)) return 'string'; // 字符串类型映射为 string
	if (/boolean/.test(type)) return 'boolean'; // boolean 类型映射为 boolean
	if (/bytea/.test(type)) return 'Buffer'; // bytea 类型映射为 Buffer
	if (/int|float|double|decimal|numeric|real/.test(type)) return 'number'; // 数字类型映射为 number
	return 'any';
}

// We can reuse the same mapType function and parser
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
	const tableBlocks = [
		...sql.matchAll(
			/create\s+table\s+[`"]?(\w+)[`"]?\s*\(([\s\S]+?)\)\s*(engine|comment|with|stored|partition|;)/gim,
		),
	];

	const tables: ParsedTable[] = [];

	for (const [, tableName, rawColumns] of tableBlocks) {
		const lines = rawColumns
			.split(/,(?![^()]*\))/) // split by commas not inside parentheses
			.map((line) => line.trim())
			.filter(
				(line) =>
					!!line && !/^(primary|unique|key|constraint|foreign|index)/i.test(line), // 过滤索引、约束定义
			);

		const columns: ParsedColumn[] = [];

		for (const line of lines) {
			const columnMatch = line.match(
				/^\s*[`"]?(\w+)[`"]?\s+([a-zA-Z0-9_]+(?:\s*\(([^)]*)\))?)([\s\S]*)$/,
			);
			if (!columnMatch) continue;

			const [, name, typeWithParens, parenContent, rest] = columnMatch;
			const rawType = typeWithParens.trim();

			const isNullable = !/not\s+null/i.test(rest);
			const isPrimary = /primary\s+key/i.test(rest);
			const isUnique = /unique/i.test(rest);
			const isAutoIncrement = /auto_increment/i.test(rest);
			const commentMatch = rest.match(/comment\s+['"]([^'"]+)['"]/i);
			const comment = commentMatch ? commentMatch[1] : undefined;

			let enumValues: string[] | undefined;
			if (/^enum/i.test(rawType) && parenContent) {
				enumValues = parenContent
					.split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
					.map((v) => v.trim().replace(/^'(.*)'$/, '$1'));
			}

			const lengthMatch = rawType.match(/\w+\((\d+)\)/);
			const length = lengthMatch ? parseInt(lengthMatch[1], 10) : undefined;

			const precisionScaleMatch = rawType.match(/\w+\((\d+),(\d+)\)/);
			const precision = precisionScaleMatch
				? parseInt(precisionScaleMatch[1], 10)
				: undefined;
			const scale = precisionScaleMatch
				? parseInt(precisionScaleMatch[2], 10)
				: undefined;

			const defaultMatch = rest.match(/default\s+(['"]?[^"]+['"]?)/i);
			const defaultValue = defaultMatch
				? defaultMatch[1].replace(/^['"]|['"]$/g, '')
				: undefined;

			columns.push({
				name,
				rawType,
				isNullable,
				comment,
				enumValues,
				length,
				precision,
				scale,
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
