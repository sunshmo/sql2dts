import { generateInterfaceName } from './util/generate-interface-name';

export function generate(cypher: string): string {
	const entities = parseCypherForNeo4j(cypher);
	return entities.map(generateInterface).join('\n\n');
}

function parseCypherForNeo4j(cypher: string): Entity[] {
	const entities: Entity[] = [];

	// 匹配节点结构，如 CREATE (:Person {name: 'Tom', age: 30})
	const nodeMatches = [...cypher.matchAll(/\(:?(\w+)?\s*{([^}]*)}\)/g)];
	for (const [, label, properties] of nodeMatches) {
		const columns = parseProperties(properties);
		entities.push({
			name: label || 'UnnamedNode',
			columns,
		});
	}

	// 匹配关系结构，如 -[:FRIENDS_WITH {since: 2020}]->
	const relMatches = [...cypher.matchAll(/\[:?(\w+)?\s*{([^}]*)}\]/g)];
	for (const [, label, properties] of relMatches) {
		const columns = parseProperties(properties);
		entities.push({
			name: label || 'UnnamedRelationship',
			columns,
		});
	}

	return entities;
}

function parseProperties(properties: string): Column[] {
	const columns: Column[] = [];

	const propMatches = [
		...properties.matchAll(/(\w+):\s*('[^']*'|\d+(\.\d+)?|true|false|null)/gi),
	];
	for (const [_, key, value] of propMatches) {
		columns.push({
			name: key,
			type: inferTypeFromValue(value),
		});
	}

	return columns;
}

function inferTypeFromValue(val: string): string {
	if (/^'.*'$/.test(val)) return 'string';
	if (/^\d+$/.test(val)) return 'number';
	if (/^\d+\.\d+$/.test(val)) return 'number';
	if (/true|false/i.test(val)) return 'boolean';
	if (/null/i.test(val)) return 'any';
	return 'any';
}

function generateInterface(entity: Entity): string {
	const interfaceName = generateInterfaceName(entity.name);
	const lines: string[] = [];

	lines.push(`export interface ${interfaceName} {`);
	for (const col of entity.columns) {
		lines.push(`  ${col.name}: ${col.type};`);
	}
	lines.push(`}`);

	return lines.join('\n');
}

interface Column {
	name: string;
	type: string;
}

interface Entity {
	name: string;
	columns: Column[];
}
