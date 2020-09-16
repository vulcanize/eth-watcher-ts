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
	// do nothing
}

// Validator types https://github.com/af/envalid#validator-types
export default envalid.cleanEnv(
	process.env,
	{
		PORT: envalid.port({
			default: tomlConfig?.APP?.PORT || 3000,
			desc: 'The port to start the server on'
		}),

		TYPEORM_HOST: envalid.host({
			default: tomlConfig?.DATABASE?.TYPEORM_HOST
		}),
		TYPEORM_USERNAME: envalid.str({
			default: tomlConfig?.DATABASE?.TYPEORM_USERNAME
		}),
		TYPEORM_PASSWORD: envalid.str({
			default: tomlConfig?.DATABASE?.TYPEORM_PASSWORD
		}),
		TYPEORM_DATABASE: envalid.str({
			default: tomlConfig?.DATABASE?.TYPEORM_DATABASE
		}),
		TYPEORM_PORT: envalid.port({
			default: tomlConfig?.DATABASE?.TYPEORM_PORT
		}),
		TYPEORM_LOGGING: envalid.bool({
			default: tomlConfig?.DATABASE?.TYPEORM_LOGGING
		})
	},
	{ strict: true }
);
