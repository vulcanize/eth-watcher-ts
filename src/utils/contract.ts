import { StateVariableDeclaration, StructDefinition, TypeName } from 'solidity-parser-diligence';

import State from '../models/contract/state';

const parser = require('@solidity-parser/parser'); // eslint-disable-line

const structureToSignatureType = (name: string, typeName: TypeName, structs: StructDefinition[], level = 0, isArray = false): {signature: string; type: string; hasStruct: boolean} => {
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
        type: typeName.namePath,
        hasStruct: true,
      };
  }
}

export const getStatesFromSourceCode = async(sourceCode: string): Promise<State[]> => {
  const ast = parser.parse(sourceCode, {
    tolerant: true,
  });

  let list = [];
  const contractDefinitions = ast?.children?.filter((item) => item.type === 'ContractDefinition');
  for (const contractDefinition of contractDefinitions) {
    const states = contractDefinition?.subNodes.filter(n => n.type == 'StateVariableDeclaration') as StateVariableDeclaration[];
    const structs = contractDefinition?.subNodes.filter(n => n.type == 'StructDefinition') as StructDefinition[];
    // TODO: Handle EnumDefinition type subnodes.

    // isImmutable property of state variable is not present in type StateVariableDeclaration.
    // TODO: Filter immutable variables after support added in https://github.com/ConsenSys/solidity-parser-antlr
    list = list.concat(states?.filter((item) => !item.variables[0]?.isDeclaredConst)
      .map((item, slot) => {
        const type: string = structureToSignatureType(item.variables[0]?.name, item.variables[0]?.typeName, structs).signature;
        return {
          slot,
          type,
          variable: item.variables[0]?.name,
        }
      })
    );
  }

  return list as State[];
}
