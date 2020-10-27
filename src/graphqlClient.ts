import { ApolloClient, gql, HttpLink, InMemoryCache, NormalizedCacheObject, split } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import * as ws from 'ws';
import * as fetch from "node-fetch";
import env from './env';

export default class GraphqlClient {

	public client: ApolloClient<NormalizedCacheObject> = null;

	public constructor (uri = env.GRAPHQL_URI) {
		const GRAPHQL_ENDPOINT = `${uri.replace('http', 'ws')}/graphql`; // wss://... or ws://...
		const HTTP_ENDPOINT = `${uri}/graphql`; // https://... or http://...

		const subscriptionClient = new SubscriptionClient(GRAPHQL_ENDPOINT, {
			reconnect: true,
			connectionCallback: (error): void => {
				error && console.error(error);
			}
		}, ws);
		const wsLink = new WebSocketLink(subscriptionClient);

		const httpLink = new HttpLink({
			uri: HTTP_ENDPOINT,
			fetch,
		});

		subscriptionClient.onError((err: ErrorEvent) => {
			console.log(err);
			if (err?.error?.code === 'ENOTFOUND') {
				throw err;
			}
		});

		const link = split(
			({ query }) => {
				const definition = getMainDefinition(query);
				return (
					definition.kind === "OperationDefinition" &&
					definition.operation === "subscription"
				);
			},
			wsLink,
			httpLink
		);

		this.client = new ApolloClient({
			link,
			cache: new InMemoryCache(),
		});
	}

	public async subscribe(query: string, onNext: (value: any) => void, onError?: (error: any) => void): Promise<any> { // eslint-disable-line
		const observable = await this.client.subscribe({
			query: gql`${query}`,
		});

		observable.subscribe({
			next(data) {
				onNext(data);
			},
			error(value) {
				onError && onError(value);
			}
		});
	}

	public async query(query: string): Promise<any> { // eslint-disable-line
		const { data } = await this.client.query({
			query: gql`${query}`,
		});

		return data;
	}
}
