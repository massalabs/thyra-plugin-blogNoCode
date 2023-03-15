package web

import (
	"mime"
	"net/http"
	"path/filepath"

	"github.com/go-openapi/runtime/middleware"
	"github.com/massalabs/thyra-plugin-hello-world/api/server/restapi/operations"
	"github.com/massalabs/thyra-plugin-wallet/pkg/openapi"
)

// webHandle  handles a Web request.
func Handle(params operations.WebParams) middleware.Responder {
	resourceName := params.Resource

	resourceContent, err := Content(resourceName)
	if err != nil {
		return operations.NewWebNotFound()
	}

	fileExtension := filepath.Ext(resourceName)

	mimeType := mime.TypeByExtension(fileExtension)

	header := map[string]string{"Content-Type": mimeType}

	return openapi.NewCustomResponder(resourceContent, header, http.StatusOK)
}

// defaultRedirectHandler redirects request to "/" URL to "web/index.html".
func DefaultRedirectHandler(_ operations.DefaultPageParams) middleware.Responder {
	return openapi.NewCustomResponder(nil, map[string]string{"Location": "web/index.html"}, http.StatusPermanentRedirect)
}
