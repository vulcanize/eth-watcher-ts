import Contract from "../models/contract/contract";
import Event from "../models/contract/event";
import State from "../models/contract/state";
import {EthReceiptCid} from "./graphql";
import {ABIElem} from "./abi";

export * from './abi';
export * from './graphql';

export type ABIInputData = {
    name: string;
    value?: any; // eslint-disable-line
}

export type DecodeReceiptResult = {
    relatedNode: EthReceiptCid;
    decoded: ABIInputData[];
    event: ABIElem;
};

export type ContractFunction = () => Contract[];
export type EventFunction = () => Event[];
export type StateFunction = () => State[];