import { generateInterfaceName } from './util/generate-interface-name';

function mapType(rawType: string, enumValues?: string[]): string {
	if (enumValues?.length) {
		return enumValues.map((v) => `'${v}'`).join(' | ');
	}

	const type = rawType.toLowerCase();
	if (
		/tinyint|smallint|mediumint|int|bigint|decimal|numeric|money|smallmoney|float|double|real/.test(
			type,
		)
	)
		return 'number';
	if (/char|nchar|nvarchar|ntext|varchar|text|longtext|enum|set/.test(type))
		return 'string';
	if (/date|datetime|timestamp|time|year|datetimeoffset/.test(type))
		return 'string';
	if (/uniqueidentifier/.test(type)) return 'string';
	if (/rowversion/.test(type)) return 'Buffer';
	if (/bit|bool|boolean/.test(type)) return 'boolean';
	if (/image|xml|binary|varbinary|blob|longblob/.test(type)) return 'Buffer';
	if (/json/.test(type)) return 'Record<string, any>';
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
			/create\s+table\s+(?:\[?(\w+)\]?\.)?\[?(\w+)\]?\s*\(([\s\S]+?)\)\s*(?:with|on|textimage_on|;)/gim,
		),
	];

	const tables: ParsedTable[] = [];

	for (const [, schema, tableName, rawColumns] of tableBlocks) {
		const lines = rawColumns
			.split(/,(?![^()]*\))/)
			.map((line) => line.trim())
			.filter(
				(line) =>
					!!line &&
					!/^(primary\s+key|unique|key|constraint|foreign|period\s+for)/i.test(
						line,
					),
			);

		const columns: ParsedColumn[] = [];

		for (const line of lines) {
			const columnMatch = line.match(
				/^\[?(\w+)\]?\s+([a-zA-Z0-9_]+(?:\s*\([^)]*\))?)([\s\S]*)$/,
			);
			if (!columnMatch) continue;

			const [, name, rawTypeFull, rest] = columnMatch;
			const rawType = rawTypeFull.trim();

			const isNullable = !/not\s+null/i.test(rest);
			const isPrimary = /primary\s+key/i.test(rest);
			const isUnique = /unique/i.test(rest);
			const isAutoIncrement = /identity\s*\(\d+,\s*\d+\)/i.test(rest);

			const commentMatch = rest.match(/--\s*(.+)$|comment\s+['"]([^'"]+)['"]/i);
			const comment = commentMatch
				? commentMatch[1] || commentMatch[2]
				: undefined;

			const defaultMatch = rest.match(/default\s+(.+?)(?:\s|,|$)/i);
			const defaultValue = defaultMatch
				? defaultMatch[1].replace(/^['"]|['"]$/g, '')
				: undefined;

			const lengthMatch = rawType.match(/\w+\((\d+)\)/);
			const length = lengthMatch ? parseInt(lengthMatch[1], 10) : undefined;

			const precisionScaleMatch = rawType.match(/\w+\((\d+),\s*(\d+)\)/);
			const precision = precisionScaleMatch
				? parseInt(precisionScaleMatch[1], 10)
				: undefined;
			const scale = precisionScaleMatch
				? parseInt(precisionScaleMatch[2], 10)
				: undefined;

			columns.push({
				name,
				rawType,
				isNullable,
				comment,
				enumValues: undefined,
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
