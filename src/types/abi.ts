export type ABIInput = {
	name: string;
	type: string;
	indexed: boolean;
	internalType: string;
}

export type ABIElem = {
	name: string;
	type: string;
	inputs: ABIInput[];
}

export type ABI = Array<ABIElem>
