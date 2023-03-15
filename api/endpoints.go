package api

import (
	"fmt"

	"github.com/go-openapi/runtime/middleware"
	"github.com/massalabs/thyra-plugin-hello-world/api/server/restapi/operations"
)

func Hello(params operations.HelloParams) middleware.Responder {
	target := "World"
	if params.Name != nil {
		target = *params.Name
	}

	return operations.NewHelloOK().WithPayload(
		&operations.HelloOKBody{Message: fmt.Sprintf("Hello, %s!", target)},
	)
}
