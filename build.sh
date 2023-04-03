#!/bin/bash -ex

PLUGIN=blognocode-plugin

mkdir -p api/server
go generate ./...

# Build the binary
mkdir -p "build/$PLUGIN/"
go build -o build/$PLUGIN/thyra-$PLUGIN thyra-plugin-blogNoCode.go
