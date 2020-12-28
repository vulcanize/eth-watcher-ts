## Build docker image
.PHONY: docker-build
docker-build:
	docker build -t vulcanize/eth-watcher-ts -f Dockerfile .