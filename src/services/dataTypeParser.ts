import { parse, SourceUnit, ContractDefinition, StateVariableDeclaration, StructDefinition, TypeName } from 'solidity-parser-diligence';
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';
import DataService from './dataService';

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

function parseStructure(name: string, typeName: TypeName, structs: StructDefinition[], level: number = 0): Structure {
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
      const members = structs.find(s => s.name == typeName.namePath)?.members;
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
 * Сonverts structure to fields
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
  let level: number = 0;
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

export function toTableOptions(tableName: string, obj: Structure, fk?: string): TableOptions[] {
    const tableOptions: TableOptions = {
        name: tableName,
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
        ]
      };

      if (fk) {
        tableOptions.columns.push({
          name: fk,
          type: 'integer',
          isNullable: false,
        });
      }

      if (obj.type === 'simple') {
        tableOptions.columns.push({
          name: obj.name,
          type: DataService._getPgType(obj.kind),
          isNullable: true,
        });
        
        return [tableOptions];
      }
      
      if (obj.type === 'mapping') {
        tableOptions.columns.push({
          name: obj.name,
          type: DataService._getPgType(obj.key),
          isNullable: true,
        });

        return [tableOptions, ...toTableOptions(`${tableName}_${obj.name}_id`, obj.value, `${obj.name}_id`)];
      }
      
      if (obj.type === 'array') {
        if (obj.kind.type === 'simple') {
          tableOptions.columns.push({
            name: obj.kind.name,
            type: DataService._getPgType(obj.kind.kind),
            isNullable: true,
            isArray: true,
          });

          return [tableOptions];
        } else if (obj.kind.type === 'mapping') {
          return [tableOptions, ...toTableOptions(`${tableName}_${obj.kind.name}_id`, obj.kind.value, `${obj.kind.name}_id`)];
        } else if (obj.kind.type === 'struct') {
          return [tableOptions, ...toTableOptions(`${tableName}_${obj.name}_id`, obj.kind, `${obj.name}_id`)];
        }
      }
      
      if (obj.type === 'struct') {
        for(const field of obj.fields) {
          if (field.type === 'simple') {
            tableOptions.columns.push({
              name: field.name,
              type: DataService._getPgType(field.kind),
              isNullable: true,
            });
          } else {
            // TODO
          }
        }

        return [tableOptions];
      }

      throw new Error('Wrong sctructure type');
}
