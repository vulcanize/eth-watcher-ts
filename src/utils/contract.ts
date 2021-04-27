import { StateVariableDeclaration, StructDefinition } from 'solidity-parser-diligence';

import State from '../models/contract/state';
import { structureToSignatureType } from '../services/dataTypeParser';

const parser = require('@solidity-parser/parser'); // eslint-disable-line

export const getStatesFromSourceCode = async (sourceCode: string): Promise<State[]> => {
  const ast = parser.parse(sourceCode, {
    tolerant: true,
  });

  let list = [];
  const contractDefinitions = ast?.children?.filter((item) => item.type === 'ContractDefinition');
  for (const contractDefinition of contractDefinitions) {
    const states = contractDefinition?.subNodes.filter(n => n.type == 'StateVariableDeclaration') as StateVariableDeclaration[];
    const structs = contractDefinition?.subNodes.filter(n => n.type == 'StructDefinition') as StructDefinition[];

    list = list.concat(states?.map((item, slot) => {
      const type: string = structureToSignatureType(item.variables[0]?.name, item.variables[0]?.typeName, structs).signature;
      return {
        slot,
        type,
        variable: item.variables[0]?.name,
      }
    }));
  }

  return list as State[];
}