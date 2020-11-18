import {
  parse as parseRawContract,
  SourceUnit, ContractDefinition, StateVariableDeclaration, StructDefinition,
  VariableDeclaration, ElementaryTypeName, UserDefinedTypeName, Mapping, ArrayTypeName,
} from 'solidity-parser-diligence';

export const errUnknownBaseTypeName = new Error('unknown typeName.baseTypeName.type');
export const errUnknownValueType = new Error('unknown typeName.valueType');
export const errUnknownTypeName = new Error('unknown typeName.type');
export const errUnknownStruct = new Error('unknown struct');
export const errUnknownVariable = new Error('unknown variable');

export type Types = { name: string; type: string; }[];

function parseElementaryTypeName(name: string, typeName: ElementaryTypeName, level: number = 0): Types {
  return [{ name, type: typeName.name }];
}

function parseArrayTypeName(typeName: ArrayTypeName, structs: StructDefinition[], level: number = 0): Types {
  let fields: Types = [{ name: `key${level}`, type: 'uint' }];

  switch (typeName.baseTypeName.type) {
    case 'ElementaryTypeName':
      return fields.concat(parseElementaryTypeName(`value${level}`, typeName.baseTypeName));
    case 'ArrayTypeName':
      return fields.concat(parseArrayTypeName(typeName.baseTypeName, structs, level + 1));
    case 'Mapping':
      return fields.concat(parseMapping(typeName.baseTypeName, structs, level + 1));
    case 'UserDefinedTypeName':
      return fields.concat(parseUserDefinedTypeName(typeName.baseTypeName, structs, level + 1));
  }

  throw errUnknownBaseTypeName;
}

function parseMapping(typeName: Mapping, structs: StructDefinition[], level: number = 0): Types {
  let fields: Types = parseElementaryTypeName(`key${level}`, typeName.keyType);

  switch (typeName.valueType.type) {
    case 'ElementaryTypeName':
      return fields.concat(parseElementaryTypeName(`value${level}`, typeName.valueType));
    case 'ArrayTypeName':
      return fields.concat(parseArrayTypeName(typeName.valueType, structs, level + 1));
    case 'Mapping':
      return fields.concat(parseMapping(typeName.valueType, structs, level + 1));
    case 'UserDefinedTypeName':
      return fields.concat(parseUserDefinedTypeName(typeName.valueType, structs, level + 1));
  }

  throw errUnknownValueType;
}

function parseUserDefinedTypeName(typeName: UserDefinedTypeName, structs: StructDefinition[], level: number = 0): Types {
  const tstruct = structs.find(s => s.name == typeName.namePath);
  if (!tstruct) {
    throw errUnknownStruct;
  }
  const fields: Types = []
  for (const variable of tstruct.members) {
    fields.push(...parseVariable(variable, structs));
  }
  return fields;
}

function parseVariable(variable: VariableDeclaration, structs: StructDefinition[] = [], level: number = 0): Types {
  switch (variable.typeName.type) {
    case 'ElementaryTypeName':
      return parseElementaryTypeName(variable.name, variable.typeName);
    case 'ArrayTypeName':
      return parseArrayTypeName(variable.typeName, structs);
    case 'Mapping':
      return parseMapping(variable.typeName, structs);
    case 'UserDefinedTypeName':
      return parseUserDefinedTypeName(variable.typeName, structs);
  }

  throw errUnknownTypeName;
}

/**
 * Parse variable from contract
 * ```typescript
 * parseContract(`
 *  contract SomeContract {
 *    mapping(address => mapping(uint => Checkpoint)) public checkpoint;
 *    struct Checkpoint {
 *      uint32 fromBlock;
 *      SomeVotes votes;
 *    }
 *    struct SomeVotes {
 *      uint96 votes;
 *    }
 *  }
 * `, checkpoint)
 * ```
 * @param contract any valid contract
 * @param name variable name
 */
export function parseContract(contract: string, name: string): Types {
  const source = parseRawContract(contract, {}) as SourceUnit;
  const nodes = (source?.children[0] as ContractDefinition).subNodes;
  const states = nodes.filter(n => n.type == 'StateVariableDeclaration') as StateVariableDeclaration[];

  const variable = states.find(n => n?.variables?.some(v => v.name == name))?.variables[0];
  if (!variable) {
    throw errUnknownVariable;
  }

  const structs = nodes.filter(n => n.type == 'StructDefinition') as StructDefinition[];
  return parseVariable(variable, structs);
}

/**
 * Parse variable from list of variables and types
 * ```typescript
 *  parse(`
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
export function parse(vars: string, name: string): Types {
  if (!vars || !vars.trim()) {
    return [];
  }

  return parseContract(`contract wrapper{ ${vars} }`, name);
}

