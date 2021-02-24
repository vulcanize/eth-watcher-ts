import Contract from "../models/contract/contract";
import Event from "../models/contract/event";
import State from "../models/contract/state";

export * from './abi';

export type ContractFunction = () => Contract[];
export type EventFunction = () => Event[];
export type StateFunction = () => State[];