/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import DataService from '../src/services/dataService';

test('_getPgType, bool', async () => {
	// @ts-ignore
	expect(await DataService._getPgType('bool')).toEqual('boolean');
});

test('_getPgType, uint8', async () => {
	// @ts-ignore
	expect(await DataService._getPgType('uint8')).toEqual('numeric');
});

test('_getPgType, uint256', async () => {
	// @ts-ignore
	expect(await DataService._getPgType('uint256')).toEqual('numeric');
});

test('_getPgType, int8', async () => {
	// @ts-ignore
	expect(await DataService._getPgType('int8')).toEqual('numeric');
});

test('_getPgType, int256', async () => {
	// @ts-ignore
	expect(await DataService._getPgType('int256')).toEqual('numeric');
});

test('_getPgType, address', async () => {
	// @ts-ignore
	expect(await DataService._getPgType('address')).toEqual('character varying(66)');
});

test('_getPgType, bytes', async () => {
	// @ts-ignore
	expect(await DataService._getPgType('bytes')).toEqual('bytea');
});
