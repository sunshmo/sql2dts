# sql2dts

A command-line tool that converts SQL files into TypeScript type definition (.d.ts) files that support multiple database types. Can also be used in the browser.


## Installation

```bash
npm install -g sql2dts
```



## Usage

- [cli](#cli)
- [esm](#esm)
- [browser](#browser)



### cli

```bash
sql2dts <input.sql> [options]
```

**Parameters**

- `<input.sql>`: Required, path to the SQL file to convert
- `-d <database>`: Optional, specifies database type (default: 'mysql')
- `-o <output>`: Optional, specifies output file path (default: '<database>.d.ts')

**Supported Database Types**

Currently supported database types include:

- athena
- bigquery
- cassandra
- clickhouse
- cockroachdb
- duckdb
- flink
- hive
- ibmdb2
- mariadb
- mysql (default)
- neo4j
- oracle
- postgre
- presto
- redshift
- snowflake
- spanner
- sqlite
- sqlserver


**Examples**

1. Basic usage:
```bash
sql2dts schema.sql
```
Reads schema.sql and generates mysql.d.ts type definitions.



2. Specify database type:
```bash
sql2dts schema.sql -d postgre
```
Generates type definitions for PostgreSQL in the current directory.



3. Full usage:

```bash
sql2dts test/msyql.sql -o types/database.d.ts -d msyql
```
Saves generated types to `types/database.d.ts`.



### esm

```js
import { generateForMysql } from 'sql2dts';

const sql = 'DROP TABLE IF EXISTS `file`;\n' +
  'CREATE TABLE `file` (\n' +
  '  `id` CHAR(36) NOT NULL,\n' +
  '  `filename` varchar(255) NOT NULL,\n' +
  '  PRIMARY KEY (`id`),\n' +
  ') ENGINE=InnoDB AUTO_INCREMENT=500 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'

console.log(generateForMysql(sql));
console.log(generateForMysql(sql, { namespace: 'DbName' }));
```


output Example:
```ts
interface File {
  id: string;
  filename: string;
}
```

Output Example (With Namespace):
```ts
namespace DbName {
  interface File {
    id: string;
    filename: string;
  }
}
```


### browser

Need to introduce static resources

```html
<script src="https://unpkg.com/sql2dts"></script>
```

How to use it in browser.
```js
sql2dts.generateForMysql(sql);
```

