export type ABIInput = {
	name: string;
	type: string;
	indexed: boolean;
	internalType: string;
}

export type ABI = Array<{
	name: string;
	type: string;
	inputs: ABIInput[];
}>
