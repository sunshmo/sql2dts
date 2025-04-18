import { generateInterfaceName } from './util/generate-interface-name';

export function generate(sql: string): string {
	const tableBlocks = parseSQL(sql, {
		statementPrefix: /(CREATE\s+(?:EXTERNAL\s+)?TABLE)\s+([\w.]+)/gi,
		statementType: 'hive',
	});

	const outputLines = tableBlocks.map((block) => {
		const tableName = generateInterfaceName(block.name);

		const fields = block.columns.map((col) => {
			const tsType = convertToTypeScript(col.type, 'hive');
			const comment = col.comment ? `/** ${col.comment} */` : '';
			return `  ${comment}\n  ${col.name}${col.nullable ? '?: ' : ': '}${tsType};`;
		});

		return `declare interface ${tableName} {\n${fields.join('\n')}\n}`;
	});

	return outputLines.join('\n\n');
}

function convertToTypeScript(type: string, dialect: string): string {
	const baseType = type.toLowerCase().trim();

	// Nullable support (nullable types)
	if (baseType.startsWith('nullable<')) {
		const innerType = baseType.match(/^nullable<(.*)>$/)?.[1]?.trim() || 'any';
		return `${convertToTypeScript(innerType, dialect)} | null`;
	}

	// Array type
	if (baseType.startsWith('array<')) {
		const inner = baseType.match(/^array<(.*)>$/)?.[1]?.trim() || 'any';
		return `${convertToTypeScript(inner, dialect)}[]`;
	}

	// Map type
	if (baseType.startsWith('map<')) {
		const match = baseType.match(/^map<([^,]+),\s*(.+)>$/);
		if (match) {
			const keyType = convertToTypeScript(match[1], dialect);
			const valueType = convertToTypeScript(match[2], dialect);
			return `Record<${keyType}, ${valueType}>`;
		}
		return 'Record<string, any>';
	}

	// Struct type
	if (baseType.startsWith('struct<')) {
		const structBody = baseType.slice(7, -1); // remove 'struct<' and trailing '>'
		const fields = structBody.split(',').map((field) => {
			const [name, typ] = field.trim().split(':');
			return `${name}: ${convertToTypeScript(typ, dialect)}`;
		});
		return `{ ${fields.join('; ')} }`;
	}

	// Basic types
	switch (baseType.split('(')[0]) {
		case 'tinyint':
		case 'smallint':
		case 'int':
		case 'bigint':
		case 'float':
		case 'double':
		case 'decimal':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'char':
		case 'varchar':
		case 'string':
			return 'string';
		case 'timestamp':
		case 'date':
			return 'string'; // or 'Date' if you want to post-process
		case 'binary':
			return 'Uint8Array'; // or 'Buffer'
		default:
			return 'any';
	}
}

interface ColumnDef {
	name: string;
	type: string;
	comment?: string;
	nullable?: boolean;
}

interface TableBlock {
	name: string;
	columns: ColumnDef[];
}

interface ParseOptions {
	statementPrefix: RegExp;
	statementType: 'hive' | string;
}

function parseSQL(sql: string, options: ParseOptions): TableBlock[] {
	const blocks: TableBlock[] = [];
	const { statementPrefix } = options;

	let match: RegExpExecArray | null;
	while ((match = statementPrefix.exec(sql)) !== null) {
		const fullMatch = match[0];
		const tableName = match[2];
		const startIndex = match.index + fullMatch.length;

		// 只截取 create table 到闭合的括号部分
		const subSql = sql.slice(startIndex);
		const openIndex = subSql.indexOf('(');
		if (openIndex === -1) continue;

		let depth = 0;
		let endIndex = -1;
		for (let i = openIndex; i < subSql.length; i++) {
			if (subSql[i] === '(') depth++;
			else if (subSql[i] === ')') depth--;
			if (depth === 0) {
				endIndex = i;
				break;
			}
		}

		if (endIndex === -1) continue;

		const columnBlock = subSql.slice(openIndex + 1, endIndex);
		const columnLines = columnBlock
			.split(/,(?![^\<]*\>)/) // 拆分字段，忽略 struct/map/array 中的逗号
			.map((line) => line.trim())
			.filter((line) => /^[\w"`]+/.test(line));

		const columns: ColumnDef[] = columnLines.map((line) => {
			const nameMatch = line.match(/^["`]?([\w]+)["`]?/);
			const typeMatch = line.match(/^[\w"`]+\s+([^\s]+(?:<.*?>)?)/);
			const commentMatch = line.match(/comment\s+'([^']+)'/i);
			const nullableMatch = line.match(/\s+(nullable)/i);

			return {
				name: nameMatch?.[1] || '',
				type: typeMatch?.[1] || 'any',
				comment: commentMatch?.[1],
				nullable: nullableMatch !== null,
			};
		});

		blocks.push({
			name: tableName,
			columns,
		});
	}

	return blocks;
}
