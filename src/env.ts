import * as envalid from 'envalid';
import * as TOML from '@iarna/toml';
import * as fs from 'fs';
import * as path from 'path';

let tomlConfig = null;
try {
	const tomlFile = fs.readFileSync(path.join(__dirname, '../config.toml'), 'utf8');

	if (tomlFile) {
		tomlConfig = TOML.parse(tomlFile);
	}
} catch (e) {
	console.warn(e);
}

// Validator types https://github.com/af/envalid#validator-types
export default envalid.cleanEnv(
	process.env,
	{

		HTTP_ENABLE: envalid.bool({
			default: tomlConfig ? tomlConfig?.http?.enable : true,
		}),
		HTTP_PORT: envalid.port({
			default: tomlConfig?.http?.port || 3000,
			desc: 'The port to start the server on'
		}),
		HTTP_ADDR: envalid.host({
			default: tomlConfig?.http?.addr || '127.0.0.1',
		}),
		HTTP_PUBLIC_ADDR: envalid.url({
			default: tomlConfig?.http?.public,
		}),

		GRAPHQL_SERVER_ENABLE: envalid.bool({
			default: tomlConfig ? tomlConfig['graphql-server']?.enable : true,
		}),
		GRAPHQL_SERVER_PORT: envalid.port({
			default: tomlConfig ? tomlConfig['graphql-server']?.port || 5000 : 5000,
			desc: 'The port to start the postgraphile server on'
		}),
		GRAPHQL_SERVER_ADDR: envalid.host({
			default: tomlConfig ? tomlConfig['graphql-server']?.addr || '127.0.0.1' : '127.0.0.1',
		}),

		CONFIG_RELOAD_INTERVAL: envalid.num({
			default: 5000
		}),

		DATABASE_HOSTNAME: envalid.host({
			default: tomlConfig?.database?.hostname
		}),
		DATABASE_USER: envalid.str({
			default: tomlConfig?.database?.user
		}),
		DATABASE_PASSWORD: envalid.str({
			default: tomlConfig?.database?.password
		}),
		DATABASE_NAME: envalid.str({
			default: tomlConfig?.database?.name
		}),
		DATABASE_PORT: envalid.port({
			default: tomlConfig?.database?.port
		}),
		DATABASE_LOGGING: envalid.bool({
			default: false
		}),

		GRAPHQL_URI: envalid.url({
			default: tomlConfig?.graphql?.uri
		}),

		ENABLE_EVENT_WATCHER: envalid.bool({
			default: tomlConfig?.watcher?.event
		}),
		ENABLE_HEADER_WATCHER: envalid.bool({
			default: tomlConfig?.watcher?.header
		}),
		ENABLE_STORAGE_WATCHER: envalid.bool({
			default: tomlConfig?.watcher?.storage
		}),		

	},
	{ strict: true }
);
