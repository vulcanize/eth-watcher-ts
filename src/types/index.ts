import Contract from "../models/contract/contract";
import Event from "../models/contract/event";
import State from "../models/contract/state";
import {EthReceiptCid, EthStateCid, EthHeaderCid} from "./graphql";
import {ABIElem} from "./abi";

export * from './abi';
export * from './graphql';

export type ABIInputData = {
    name: string;
    value?: any; // eslint-disable-line
    type?: string;
}

export type DecodeReceiptResult = {
    relatedNode: EthReceiptCid;
    decoded: ABIInputData[];
    event: ABIElem;
    meta: JSON;
};

export type DecodeStateResult = {
    relatedNode: EthStateCid;
    decoded: ABIInputData[];
    meta: JSON;
};

export type ContractFunction = () => Contract[];
export type EventFunction = () => Event[];
export type StateFunction = () => State[];

export type ProcessEventFunction = (data: DecodeReceiptResult) => any; // eslint-disable-line
export type ProcessHeaderFunction = (data: EthHeaderCid) => any; // eslint-disable-line
export type ProcessStateFunction = (data: DecodeStateResult) => any; // eslint-disable-line
