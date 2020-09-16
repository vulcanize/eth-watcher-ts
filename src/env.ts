const envalid = require('envalid'); // eslint-disable-line

// Validator types https://github.com/af/envalid#validator-types
export default envalid.cleanEnv(
	process.env,
	{
		PORT: envalid.port({
			default: 3000,
			desc: 'The port to start the server on'
		}),

		TYPEORM_HOST: envalid.host(),
		TYPEORM_USERNAME: envalid.str(),
		TYPEORM_PASSWORD: envalid.str(),
		TYPEORM_DATABASE: envalid.str(),
		TYPEORM_PORT: envalid.port(),
	},
	{ strict: true }
);
