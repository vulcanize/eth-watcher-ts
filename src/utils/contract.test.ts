import {getStatesFromSourceCode} from "./contract";

describe('getStatesfromSourceCode', () => {
  test('elementary types', async () => {
    const sourceCode = `
    contract Test {
      string public constant name = "Uniswap";

      uint8 public constant decimals = 18;
    }
    `;

    const states = await getStatesFromSourceCode(sourceCode);
    expect(states).toStrictEqual([
      { slot: 0, type: 'string name;', variable: 'name' },
      { slot: 1, type: 'uint8 decimals;', variable: 'decimals' }
    ])
  })

  test('array types', async () => {
    const sourceCode = `
    contract Test {
      string[] public names = ["Uniswap"];

      string[][] public names;
    }
    `;

    const states = await getStatesFromSourceCode(sourceCode);
    expect(states).toStrictEqual([
      { slot: 0, type: 'string[] names;', variable: 'names' },
      { slot: 1, type: 'string[] names;', variable: 'names' }
    ])
  })

  test('mapping types', async () => {
    const sourceCode = `
    contract Test {
      mapping (address => uint96) internal balances;

      mapping (address => mapping (address => uint96)) internal allowances;
    }
    `;

    const states = await getStatesFromSourceCode(sourceCode);
    expect(states).toStrictEqual([
      {
        slot: 0,
        type: 'mapping (address => uint96) balances;',
        variable: 'balances'
      },
      {
        slot: 1,
        type: 'mapping (address => mapping (address => uint96)) allowances;',
        variable: 'allowances'
      }
    ])
  })

  test('user defined types', async () => {
    const sourceCode = `
    contract Test {
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
      
      Checkpoint checkpoint;

      Checkpoint[] public checkpointList;

      mapping(address => Checkpoint) public checkpointMap;
    }
    `;

    const states = await getStatesFromSourceCode(sourceCode);
    expect(states).toStrictEqual([
      {
        slot: 0,
        type: 'Checkpoint checkpoint; struct Checkpoint {uint32 fromBlock;uint96 votes;}',
        variable: 'checkpoint'
      },
      {
        slot: 1,
        type: 'Checkpoint[] checkpointList; struct Checkpoint {uint32 fromBlock;uint96 votes;}',
        variable: 'checkpointList'
      },
      {
        slot: 2,
        type: 'mapping (address => Checkpoint) checkpointMap; struct Checkpoint {uint32 fromBlock;uint96 votes;}',
        variable: 'checkpointMap'
      }
    ])
  })
});
