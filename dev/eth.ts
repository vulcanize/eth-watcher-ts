// ts-node ./dev/eth.ts 

import { rlp, toBuffer, toAscii, toUtf8 } from 'ethereumjs-util';
const abi = require('ethereumjs-abi')

const buffer = Buffer.from('f901a4018270b8b9010000000000000000000000000000000000000000000000000000000000800000000000000000000000000000800000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000f89bf89994c4d8b1f4266845ca9936a4f2f604b4017f188890e1a0bb4847942d98bb5bb249692c72ce235605e41502e705831e609875320ef2cac7b8600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000378797a0000000000000000000000000000000000000000000000000000000000', 'hex');
const decoded: any = rlp.decode(buffer);
console.log(decoded);

//abc293dfgkbkb123gabcz1234567890
// console.log(decoded[0].toString('hex'));
const storageData = decoded[1];
console.log('storage data', storageData.toString('hex'));
const storageDataDecoded = rlp.decode(storageData);
console.log('storageDataDecoded', storageDataDecoded, toUtf8(storageDataDecoded.toString('hex')));
// const len = parseInt(storageDataDecoded.toString('hex', storageData.length-2), 16);
// console.log('decoded storage data', len);
// console.log('decoded storage data', toAscii(storageDataDecoded.toString('hex', 0, len*2)));
// console.log(abi.rawDecode(['string'], rlp.decode(Buffer.from(decoded[1], 'hex'))));
// console.log(decoded[2].toString('hex'));
//
// console.log(decoded[3][0][0].toString('hex'));
// console.log(decoded[3][0][1]);
// console.log(decoded[3][0][1][0].toString('hex'));
// console.log(decoded[3][0][1][1].toString('hex'));
//
// var a = abi.rawDecode([ 'uint256' ], Buffer.from('0000000000000000000000000000000000000000000000000000000000000004', 'hex'))
// console.log(a, a.toString());
// var b =abi.rawEncode([ 'uint256' ], [ 0 ]).toString('hex')
// console.log(b);