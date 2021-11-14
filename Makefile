.PHONY: all build clean

build:
	GOOS=linux
	GOARCH=amd64
	GO111MODULE=auto GOBIN=${PWD}/built-lambda GO_IMPORT_PATH=src/lambda go get ./...
	GO111MODULE=auto GOBIN=${PWD}/built-lambda GO_IMPORT_PATH=src/lambda go install ./...
