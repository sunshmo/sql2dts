export function generateInterfaceName(str: string): string {
	return str
		.split('.')
		.map((part) => {
			const suffix = part.slice(1).replace(/_\w/g, (x) => x[1].toUpperCase());
			return part.charAt(0).toUpperCase() + suffix;
		})
		.join('');
}
