import { toStructure, toFields, } from './dataTypeParser';

describe('dataTypeParser', function () {
  test('elementary types', function () {
    const st1 = toStructure('string public constant name = "Uniswap";', 'name');
    expect(st1).toStrictEqual({
      "kind": "string",
      "name": "name",
      "type": "simple"
    });
    expect(toFields(st1)).toStrictEqual([{ "name": "name", "type": "string" }]);

    const st2 = toStructure('uint8 public constant decimals = 18;', 'decimals');
    expect(st2).toStrictEqual({
      "kind": "uint8",
      "name": "decimals",
      "type": "simple"
    });
    expect(toFields(st2)).toStrictEqual([{ "name": "decimals", "type": "uint8" }]);
  });

  test('array types', function () {
    const st1 = toStructure('string[] public names = ["Uniswap"];', 'names');
    expect(st1).toStrictEqual({
      "kind": {
        "kind": "string",
        "name": "value0",
        "type": "simple"
      },
      "name": "names",
      "type": "array"
    });
    expect(toFields(st1)).toStrictEqual([
      { "name": "key0", "type": "uint" },
      { "name": "value0", "type": "string" },
    ]);

    const st2 = toStructure('string[][] public names;', 'names');
    expect(st2).toStrictEqual({
      "kind": {
        "kind": {
          "kind": "string",
          "name": "value1",
          "type": "simple"
        },
        "name":
          "value0",
        "type": "array"
      },
      "name": "names",
      "type": "array"
    });
    expect(toFields(st2)).toStrictEqual([
      { "name": "key0", "type": "uint" },
      { "name": "key1", "type": "uint" },
      { "name": "value1", "type": "string" },
    ]);
  });

  test('mapping types', function () {
    const st1 = toStructure('mapping (address => uint96) internal balances;', 'balances');
    expect(st1).toStrictEqual({
      "key": "address",
      "name": "balances",
      "type": "mapping",
      "value": {
        "kind": "uint96",
        "name": "value0",
        "type": "simple"
      }
    });
    expect(toFields(st1)).toStrictEqual([
      { "name": "key0", "type": "address" },
      { "name": "value0", "type": "uint96" },
    ]);

    const st2 = toStructure('mapping (address => mapping (address => uint96)) internal allowances;', 'allowances');
    expect(st2).toStrictEqual({
      "key": "address",
      "name": "allowances",
      "type": "mapping",
      "value": {
        "key": "address",
        "name": "value0",
        "type": "mapping",
        "value": {
          "kind":
            "uint96",
          "name": "value1",
          "type": "simple"
        }
      }
    });
    expect(toFields(st2)).toStrictEqual([
      { "name": "key0", "type": "address" },
      { "name": "key1", "type": "address" },
      { "name": "value1", "type": "uint96" },
    ]);
  });

  test('user defined types', function () {
    const vars1 = `
      Checkpoint checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
    `;
    const st1 = toStructure(vars1, 'checkpoint');
    expect(st1).toStrictEqual({
      "fields": [
        { "kind": "uint32", "name": "fromBlock", "type": "simple" },
        { "kind": "uint96", "name": "votes", "type": "simple" }
      ],
      "name": "checkpoint",
      "type": "struct"
    });
    expect(toFields(st1)).toStrictEqual([
      { "name": "votes", "type": "uint96" },
      { "name": "fromBlock", "type": "uint32" }
    ]);

    const vars2 = `
      Checkpoint[] public checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
    `;
    const st2 = toStructure(vars2, 'checkpoint');
    expect(st2).toStrictEqual({
      "kind": {
        "fields": [
          { "kind": "uint32", "name": "fromBlock", "type": "simple" },
          { "kind": "uint96", "name": "votes", "type": "simple" }
        ],
        "name": "value0",
        "type": "struct"
      },
      "name": "checkpoint",
      "type": "array"
    });
    expect(toFields(st2)).toStrictEqual([
      { "name": "key0", "type": "uint" },
      { "name": "votes", "type": "uint96" },
      { "name": "fromBlock", "type": "uint32" }
    ]);

    const vars3 = `
      mapping(address => Checkpoint) public checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
    `;
    const st3 = toStructure(vars3, 'checkpoint');
    expect(st3).toStrictEqual({
      "key": "address",
      "name": "checkpoint",
      "type": "mapping",
      "value": {
        "fields": [
          { "kind": "uint32", "name": "fromBlock", "type": "simple" },
          { "kind": "uint96", "name": "votes", "type": "simple" }
        ],
        "name": "value0",
        "type": "struct"
      }
    });
    expect(toFields(st3)).toStrictEqual([
      { "name": "key0", "type": "address" },
      { "name": "votes", "type": "uint96" },
      { "name": "fromBlock", "type": "uint32" }
    ]);

    const vars4 = `
      mapping(address => mapping(uint => Checkpoint)) public checkpoint;
      struct Checkpoint {
        uint32 fromBlock;
        uint96 votes;
      }
    `;
    const st4 = toStructure(vars4, 'checkpoint');
    expect(st4).toStrictEqual({
      "key": "address",
      "name": "checkpoint",
      "type": "mapping",
      "value": {
        "key": "uint",
        "name": "value0",
        "type": "mapping",
        "value": {
          "fields": [
            { "kind": "uint32", "name": "fromBlock", "type": "simple" },
            { "kind": "uint96", "name": "votes", "type": "simple" }
          ],
          "name": "value1",
          "type": "struct"
        }
      }
    });
    expect(toFields(st4)).toStrictEqual([
      { "name": "key0", "type": "address" },
      { "name": "key1", "type": "uint" },
      { "name": "votes", "type": "uint96" },
      { "name": "fromBlock", "type": "uint32" }
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
    const st5 = toStructure(vars5, 'checkpoint');
    expect(st5).toStrictEqual({
      "key": "address",
      "name": "checkpoint",
      "type": "mapping",
      "value": {
        "key": "uint",
        "name": "value0",
        "type": "mapping",
        "value": {
          "fields": [
            { "kind": "uint32", "name": "fromBlock", "type": "simple" },
            { "fields": [{ "kind": "uint96", "name": "votes", "type": "simple" }], "name": "votes", "type": "struct" }
          ],
          "name": "value1",
          "type": "struct"
        }
      }
    });
    expect(toFields(st5)).toStrictEqual([
      { "name": "key0", "type": "address" },
      { "name": "key1", "type": "uint" },
      { "name": "votes", "type": "uint96" },
      { "name": "fromBlock", "type": "uint32" }
    ]);
  });
})