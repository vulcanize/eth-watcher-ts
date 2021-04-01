import { parse, SourceUnit, ContractDefinition, StateVariableDeclaration, StructDefinition, TypeName } from 'solidity-parser-diligence';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';
import {TableForeignKeyOptions} from "typeorm/schema-builder/options/TableForeignKeyOptions";

export const errUnknownVariable = new Error('unknown variable');

export type Type = 'simple' | 'array' | 'mapping' | 'struct';

export type BaseStructure = {
  name: string;
  type: Type;
}

export type SimpleStructure = BaseStructure & {
  type: 'simple';
  kind: string;
}

export type ArrayStructure = BaseStructure & {
  type: 'array';
  kind: Structure;
}

export type MappingStructure = BaseStructure & {
  type: 'mapping';
  key: string;
  value: Structure;
}

export type CustomStructure = BaseStructure & {
  type: 'struct';
  fields: Structure[];
}

export type Structure = SimpleStructure | ArrayStructure | MappingStructure | CustomStructure;

export type Field = {
  name: string;
  type: string;
}

function getPgType(abiType: string): string {
  let pgType;

  // Fill in pg type based on abi type
  switch (abiType.replace(/\d+/g, '')) {
    case 'address':
      pgType = 'character varying(66)';
      break;
    case 'int':
    case 'uint':
      pgType = 'numeric';
      break;
    case 'bool':
      pgType = 'boolean';
      break;
    case 'bytes':
      pgType = 'bytea';
      break;
    // case abi.ArrayTy:
    // 	pgType = 'text[]';
    // 	break;
    default:
      pgType = 'text';
  }

  return pgType;
}

function parseStructure(name: string, typeName: TypeName, structs: StructDefinition[], level = 0): Structure {
  switch (typeName.type) {
    case 'ElementaryTypeName':
      return { name, type: 'simple', kind: typeName.name } as SimpleStructure;
    case 'ArrayTypeName':
      return {
        name,
        type: 'array',
        kind: parseStructure(`value${level}`, typeName.baseTypeName, structs, level + 1),
      } as ArrayStructure;
    case 'Mapping':
      return {
        name,
        type: 'mapping',
        key: typeName.keyType.name,
        value: parseStructure(`value${level}`, typeName.valueType, structs, level + 1),
      } as MappingStructure;
    case 'UserDefinedTypeName':
      const members = structs.find(s => s.name == typeName.namePath)?.members; // eslint-disable-line
      if (!members) {
        return null;
      }
      return {
        name,
        type: 'struct',
        fields: members.map(m => parseStructure(m.name, m.typeName, structs, level + 1))
      } as CustomStructure
  }
}

export function structureToSignatureType(name: string, typeName: TypeName, structs: StructDefinition[], level = 0, isArray = false): {signature: string; type: string; hasStruct: boolean} {
  let structsDef = '';
  if (level === 0 && structs && structs.length) {
    for (const struct of structs) {
      structsDef += ` struct ${struct.name} {` + struct.members.map(m => structureToSignatureType(m.name, m.typeName, structs, level + 1).signature).join('') + '}';
    }
  }

  switch (typeName.type) {
    case 'ElementaryTypeName':
      return {
        signature: `${typeName.name}${isArray ? '[]' : ''} ${name};`,
        type: typeName.name,
        hasStruct: false,
      }
    case 'ArrayTypeName': {
      const res = structureToSignatureType(name, typeName.baseTypeName, structs, level + 1, true);
      return {
        signature: res.signature + (level === 0 && res.hasStruct ? structsDef : ''),
        type: typeName.baseTypeName?.type,
        hasStruct: res.hasStruct,
      }
    }
    case 'Mapping': {
      const res = structureToSignatureType(name, typeName.valueType, structs, level + 1);
      return {
        signature: `mapping (${typeName.keyType.name} => ${res.type}) ${name};` + (level === 0 && res.hasStruct ? structsDef : ''),
        type: `mapping (${typeName.keyType.name} => ${res.type})`, // for mapping => mapping case
        hasStruct: res.hasStruct,
      }
    }
    case 'UserDefinedTypeName':
      return {
        signature: `${typeName.namePath}${isArray ? '[]' : ''} ${name};` + (level === 0 ? structsDef : ''),
        type: typeName.type,
        hasStruct: true,
      };
  }
}

/**
 * Parse structure from list of variables and types
 * ```typescript
 *  toStructure(`
 *    mapping(address => mapping(uint => Checkpoint)) public checkpoint;
 *    struct Checkpoint {
 *      uint32 fromBlock;
 *      SomeVotes votes;
 *    }
 *    struct SomeVotes {
 *      uint96 votes;
 *    }
 * `,'checkpoint');
 * ```
 * @param vars list variables and types
 * @param name variable name
 */
export function toStructure(vars: string, name: string): Structure {
  const source = parse(`contract wrapper{ ${vars} }`, {}) as SourceUnit;
  const anodes = (source.children[0] as ContractDefinition).subNodes;

  const states = anodes.filter(n => n.type == 'StateVariableDeclaration') as StateVariableDeclaration[];
  const structs = anodes.filter(n => n.type == 'StructDefinition') as StructDefinition[];

  const variable = states.find(s => s?.variables?.some(v => v.name == name))?.variables[0];
  if (!variable) {
    throw errUnknownVariable;
  }

  return parseStructure(name, variable.typeName, structs);
}

/**
 * Converts structure to fields
 * ```typescript
 * const structure: SimpleStructure = {
 *   kind: 'string'
 *   name: 'someName'
 *   type: 'simple'
 * }
 * toFields(structure)
 * ```
 * @param obj
 */
export function toFields(obj: Structure): Field[] {
  const stack: Structure[] = [obj];
  const fields: Field[] = [];
  let level = 0;
  while (stack.length > 0) {
    const obj = stack.pop();
    switch (obj.type) {
      case 'simple':
        fields.push({
          name: obj.name,
          type: obj.kind,
        });
        break;
      case 'array':
        fields.push({
          name: `key${level}`,
          type: 'uint',
        });
        stack.push(obj.kind)
        break;
      case 'mapping':
        fields.push({
          name: `key${level}`,
          type: obj.key,
        });
        stack.push(obj.value);
        break;
      case 'struct':
        for (const field of obj.fields) {
          stack.push(field);
        }
        break;
    }
    level++;
  }
  return fields;
}

export function toTableOptions(tableName: string, obj: Structure, fk?: TableForeignKeyOptions): TableOptions[] {
    const tableOptions: TableOptions = {
        name: tableName,
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          }
        ],
        foreignKeys: [],
      };

      if (fk) {
        tableOptions.columns.push({
          name: fk.columnNames[0],
          type: 'integer',
          isNullable: false,
        });

        tableOptions.foreignKeys.push(fk);
      }

      if (obj.type === 'simple') {
        tableOptions.columns.push(...[
          {
            name: 'state_id',
            type: 'integer',
          },
          {
            name: 'contract_id',
            type: 'integer',
          }, {
            name: 'mh_key',
            type: 'text',
          }, {
          name: obj.name,
          type: getPgType(obj.kind),
          isNullable: true,
        }]);

        return [tableOptions];
      }

      if (obj.type === 'mapping') {
        tableOptions.columns.push({
          name: obj.name,
          type: getPgType(obj.key),
          isNullable: true,
        });

        // add relation to address table for mapping(address => ..)
        if (obj.key === 'address') {
          tableOptions.columns.push({
            name: 'address_id',
            type: 'integer',
            isNullable: true,
          });
          tableOptions.foreignKeys.push({
            name: `address_id_data.address`,
            columnNames: ['address_id'],
            referencedTableName: 'data.addresses',
            referencedColumnNames: ['address_id'],
          });
        }

        const fkChildTable: TableForeignKeyOptions = {
          name: `${tableName}_${obj.name}_id`,
          columnNames: [`${obj.name}_id`],
          referencedTableName: tableName,
          referencedColumnNames: ['id'],
        };

        return [tableOptions, ...toTableOptions(`${tableName}_${obj.name}_id`, obj.value, fkChildTable)];
      }

      if (obj.type === 'array') {
        if (obj.kind.type === 'simple') {
          tableOptions.columns.push({
            name: obj.kind.name,
            type: getPgType(obj.kind.kind),
            isNullable: true,
            isArray: true,
          });

          return [tableOptions];
        } else if (obj.kind.type === 'mapping') {
          const fkChildTable: TableForeignKeyOptions = {
            name: `${tableName}_${obj.kind.name}_id`,
            columnNames: [`${obj.kind.name}_id`],
            referencedTableName: tableName,
            referencedColumnNames: [obj.kind.name],
          };

          return [tableOptions, ...toTableOptions(`${tableName}_${obj.kind.name}_id`, obj.kind.value, fkChildTable)];
        } else if (obj.kind.type === 'struct') {
          const fkChildTable: TableForeignKeyOptions = {
            name: `${tableName}_${obj.name}_id`,
            columnNames: [`${obj.name}_id`],
            referencedTableName: tableName,
            referencedColumnNames: [obj.name],
          };

          return [tableOptions, ...toTableOptions(`${tableName}_${obj.name}_id`, obj.kind, fkChildTable)];
        }
      }

      if (obj.type === 'struct') {
        for(const field of obj.fields) {
          if (field.type === 'simple') {
            tableOptions.columns.push({
              name: field.name,
              type: getPgType(field.kind),
              isNullable: true,
            });
          } else {
            // TODO
          }
        }

        return [tableOptions];
      }

      throw new Error('Wrong structure type');
}
