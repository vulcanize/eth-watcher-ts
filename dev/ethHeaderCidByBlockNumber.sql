CREATE OR REPLACE FUNCTION "ethHeaderCidByBlockNumber"(n bigint)
RETURNS SETOF eth.header_cids
LANGUAGE 'sql' STABLE AS
$$ SELECT * FROM eth.header_cids WHERE block_number=$1 ORDER BY id $$;
ALTER FUNCTION "ethHeaderCidByBlockNumber"(n bigint) OWNER TO vdbm;