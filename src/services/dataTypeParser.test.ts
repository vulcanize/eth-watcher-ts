import { parse, errUnknownVariable, errUnknownStruct } from './dataTypeParser';

describe('dataTypeParser.parse', function () {

  test('empty', function () {
    expect(parse('', 'someName')).toStrictEqual([]);
    expect(parse(null, 'someName')).toStrictEqual([]);
    expect(parse('      ', 'someName')).toStrictEqual([]);
  });

  test('bad data types', function () {
    expect(parse.bind(null, 'asd', 'someVar')).toThrow(/mismatched/);
    expect(parse.bind(null, 'uint public', 'someVar')).toThrow(/extraneous input/);
    expect(parse.bind(null, 'uint public a', 'someVar')).toThrow(/mismatched/);
  });

  test('not found', function () {
    expect(parse.bind(null, 'string public constant name;', 'someVar')).toThrow(errUnknownVariable);
    expect(parse.bind(null, 'Checkpoint chck;', 'chck')).toThrow(errUnknownStruct);
  });

  test('elementary types', function () {
    expect(parse('string public constant name = "Uniswap";', 'name'))
      .toStrictEqual([{ name: 'name', type: 'string' }]);
    expect(parse('uint8 public constant decimals = 18;', 'decimals'))
      .toStrictEqual([{ name: 'decimals', type: 'uint8' }]);
  });

  test('array types', function () {
    expect(parse('string[] public names = ["Uniswap"];', 'names'))
      .toStrictEqual([{ name: 'key0', type: 'uint' }, { name: 'value0', type: 'string' }]);
    expect(parse('string[][] public names;', 'names'))
      .toStrictEqual([{ name: 'key0', type: 'uint' }, { name: 'key1', type: 'uint' }, { name: 'value1', type: 'string' }]);
  });

  test('mapping types', function () {
    expect(parse('mapping (address => uint96) internal balances;', 'balances'))
      .toStrictEqual([{ name: 'key0', type: 'address' }, { name: 'value0', type: 'uint96' }]);
    expect(parse('mapping (address => mapping (address => uint96)) internal allowances;', 'allowances'))
      .toStrictEqual([{ name: 'key0', type: 'address' }, { name: 'key1', type: 'address' }, { name: 'value1', type: 'uint96' }]);
  });

  test('user defined types', function () {
    const vars1 = `
      Checkpoint checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
    `;
    expect(parse(vars1, 'checkpoint')).toStrictEqual([
      { name: 'fromBlock', type: 'uint32' },
      { name: 'votes', type: 'uint96' }
    ]);

    const vars2 = `
      Checkpoint[] public checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
    `;
    expect(parse(vars2, 'checkpoint')).toStrictEqual([
      { name: 'key0', type: 'uint' },
      { name: 'fromBlock', type: 'uint32' },
      { name: 'votes', type: 'uint96' }
    ]);

    const vars3 = `
      mapping(address => Checkpoint) public checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
    `;
    expect(parse(vars3, 'checkpoint')).toStrictEqual([
      { name: 'key0', type: 'address' },
      { name: 'fromBlock', type: 'uint32' },
      { name: 'votes', type: 'uint96' }
    ]);

    const vars4 = `
      mapping(address => mapping(uint => Checkpoint)) public checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
    `;
    expect(parse(vars4, 'checkpoint')).toStrictEqual([
      { name: 'key0', type: 'address' },
      { name: 'key1', type: 'uint' },
      { name: 'fromBlock', type: 'uint32' },
      { name: 'votes', type: 'uint96' }
    ]);

    const vars5 = `
      mapping(address => mapping(uint => Checkpoint)) public checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        SomeVotes votes;
      }
      struct SomeVotes {
        uint96 votes;
      }
    `;
    expect(parse(vars5, 'checkpoint')).toStrictEqual([
      { name: 'key0', type: 'address' },
      { name: 'key1', type: 'uint' },
      { name: 'fromBlock', type: 'uint32' },
      { name: 'votes', type: 'uint96' }
    ]);
  });
})

