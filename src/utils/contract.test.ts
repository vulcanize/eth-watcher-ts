import {getStatesFromSourceCode} from "./contract";

describe('getStatesfromSourceCode', () => {
  test('elementary types', async () => {
    const sourceCode = `
    contract Test {
      string public constant name = "Uniswap";

      uint8 public constant decimals = 18;

      int256 public immutable integers = -21;

      bool internal constant boolean = true;

      address private constant plainAddress = '0x1ca7c995f8eF0A2989BbcE08D5B7Efe50A584aa1'

      address payable constant payableAddress = '0xbb38B6F181541a6cEdfDac0b94175B2431Aa1A02'

      bytes32 constant byteText = "ByteText";
    }
    `;

    const states = await getStatesFromSourceCode(sourceCode);
    expect(states).toStrictEqual([
      { slot: 0, type: 'string name;', variable: 'name' },
      { slot: 1, type: 'uint8 decimals;', variable: 'decimals' },
      { slot: 2, type: 'int256 integers;', variable: 'integers' },
      { slot: 3, type: 'bool boolean;', variable: 'boolean' },
      { slot: 4, type: 'address plainAddress;', variable: 'plainAddress' },
      {
        slot: 5,
        type: 'address payableAddress;',
        variable: 'payableAddress'
      },
      { slot: 6, type: 'bytes32 byteText;', variable: 'byteText' }
    ])
  })

  test('array types', async () => {
    const sourceCode = `
    contract Test {
      string[] public names = ["Uniswap"];

      string[][] public nestedNames;

      uint[] public decimalList;
    }
    `;

    const states = await getStatesFromSourceCode(sourceCode);
    expect(states).toStrictEqual([
      { slot: 0, type: 'string[] names;', variable: 'names' },
      { slot: 1, type: 'string[] nestedNames;', variable: 'nestedNames' },
      { slot: 2, type: 'uint[] decimalList;', variable: 'decimalList' }
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
      enum ActionChoices { GoLeft, GoRight, GoStraight, SitStill }

      ActionChoices choice;

      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
      
      Checkpoint checkpoint;

      Checkpoint[] public checkpointList;

      mapping(address => Checkpoint) public checkpointMap;

      mapping(address => mapping(uint => Checkpoint)) public checkpointNestedMap;

      struct NestedCheckpoint {
        uint32 fromBlock;
        SomeVotes votes;
      }

      struct SomeVotes {
        uint96 votes;
      }

      mapping(address => mapping(uint => NestedCheckpoint)) public nestedCheckpointNestedMap;

      struct KeyFlag {
        uint key;
        bool deleted;
      }

      struct ComplexCheckpoint {
        uint32 fromBlock;
        mapping(uint => SomeVotes) votes;
        KeyFlag[] keys;
      }

      mapping(address => ComplexCheckpoint) public complexCheckpointMap;
    }
    `;

    const states = await getStatesFromSourceCode(sourceCode);

    expect(states).toStrictEqual([
      {
        slot: 0,
        type: 'ActionChoices choice; struct Checkpoint {uint32 fromBlock;uint96 votes;} struct NestedCheckpoint {uint32 fromBlock;SomeVotes votes;} struct SomeVotes {uint96 votes;} struct KeyFlag {uint key;bool deleted;} struct ComplexCheckpoint {uint32 fromBlock;mapping (uint => SomeVotes) votes;KeyFlag[] keys;}',
        variable: 'choice'
      },
      {
        slot: 1,
        type: 'Checkpoint checkpoint; struct Checkpoint {uint32 fromBlock;uint96 votes;} struct NestedCheckpoint {uint32 fromBlock;SomeVotes votes;} struct SomeVotes {uint96 votes;} struct KeyFlag {uint key;bool deleted;} struct ComplexCheckpoint {uint32 fromBlock;mapping (uint => SomeVotes) votes;KeyFlag[] keys;}',
        variable: 'checkpoint'
      },
      {
        slot: 2,
        type: 'Checkpoint[] checkpointList; struct Checkpoint {uint32 fromBlock;uint96 votes;} struct NestedCheckpoint {uint32 fromBlock;SomeVotes votes;} struct SomeVotes {uint96 votes;} struct KeyFlag {uint key;bool deleted;} struct ComplexCheckpoint {uint32 fromBlock;mapping (uint => SomeVotes) votes;KeyFlag[] keys;}',
        variable: 'checkpointList'
      },
      {
        slot: 3,
        type: 'mapping (address => Checkpoint) checkpointMap; struct Checkpoint {uint32 fromBlock;uint96 votes;} struct NestedCheckpoint {uint32 fromBlock;SomeVotes votes;} struct SomeVotes {uint96 votes;} struct KeyFlag {uint key;bool deleted;} struct ComplexCheckpoint {uint32 fromBlock;mapping (uint => SomeVotes) votes;KeyFlag[] keys;}',
        variable: 'checkpointMap'
      },
      {
        slot: 4,
        type: 'mapping (address => mapping (uint => Checkpoint)) checkpointNestedMap; struct Checkpoint {uint32 fromBlock;uint96 votes;} struct NestedCheckpoint {uint32 fromBlock;SomeVotes votes;} struct SomeVotes {uint96 votes;} struct KeyFlag {uint key;bool deleted;} struct ComplexCheckpoint {uint32 fromBlock;mapping (uint => SomeVotes) votes;KeyFlag[] keys;}',
        variable: 'checkpointNestedMap'
      },
      {
        slot: 5,
        type: 'mapping (address => mapping (uint => NestedCheckpoint)) nestedCheckpointNestedMap; struct Checkpoint {uint32 fromBlock;uint96 votes;} struct NestedCheckpoint {uint32 fromBlock;SomeVotes votes;} struct SomeVotes {uint96 votes;} struct KeyFlag {uint key;bool deleted;} struct ComplexCheckpoint {uint32 fromBlock;mapping (uint => SomeVotes) votes;KeyFlag[] keys;}',
        variable: 'nestedCheckpointNestedMap'
      },
      {
        slot: 6,
        type: 'mapping (address => ComplexCheckpoint) complexCheckpointMap; struct Checkpoint {uint32 fromBlock;uint96 votes;} struct NestedCheckpoint {uint32 fromBlock;SomeVotes votes;} struct SomeVotes {uint96 votes;} struct KeyFlag {uint key;bool deleted;} struct ComplexCheckpoint {uint32 fromBlock;mapping (uint => SomeVotes) votes;KeyFlag[] keys;}',
        variable: 'complexCheckpointMap'
      }
    ])
  })
});
