import { generateInterfaceName } from './util/generate-interface-name';

function mapType(rawType: string, enumValues?: string[]): string {
	if (enumValues?.length) {
		return enumValues.map((v) => `'${v}'`).join(' | ');
	}

	const type = rawType.toLowerCase();
	if (/int|float|double|decimal|numeric|real/.test(type)) return 'number';
	if (/char|text|uuid|json|enum|set/.test(type)) return 'string';
	if (/date|time|year/.test(type)) return 'string';
	if (/bool|bit/.test(type)) return 'boolean';
	if (/binary|blob/.test(type)) return 'Buffer';
	return 'any';
}

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
					!!line && !/^(primary|unique|key|constraint|foreign|index)/i.test(line),
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

			const defaultMatch = rest.match(/default\s+(['"]?[^"']+['"]?)/i);
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
