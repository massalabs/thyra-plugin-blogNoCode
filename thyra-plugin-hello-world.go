package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/go-openapi/loads"
	"github.com/massalabs/thyra-plugin-hello-world/api"
	"github.com/massalabs/thyra-plugin-hello-world/api/server/restapi"
	"github.com/massalabs/thyra-plugin-hello-world/api/server/restapi/operations"
	"github.com/massalabs/thyra-plugin-hello-world/pkg/plugin"
	"github.com/massalabs/thyra-plugin-hello-world/web"
)

const logoFile = "logo_massa.webp"

func killTime(quit chan bool) {

	fmt.Fprintf(os.Stdout, "Plugin is initializing.\n")

	for {
		select {

		case <-quit:
			fmt.Fprintf(os.Stdout, "Plugin is shutting down.\nBye!\n")

			return
		}
	}
}

func initializeAPI() *restapi.Server {
	swaggerSpec, err := loads.Analyzed(restapi.SwaggerJSON, "")
	if err != nil {
		panic(err)
	}

	pluginAPI := operations.NewHelloWorldAPI(swaggerSpec)
	server := restapi.NewServer(pluginAPI)

	pluginAPI.WebHandler = operations.WebHandlerFunc(web.Handle)
	pluginAPI.DefaultPageHandler = operations.DefaultPageHandlerFunc(web.DefaultRedirectHandler)
	pluginAPI.HelloHandler = operations.HelloHandlerFunc(api.Hello)

	server.ConfigureAPI()

	return server
}

func main() {
	quit := make(chan bool)
	intSig := make(chan os.Signal, 1)
	signal.Notify(intSig, syscall.SIGINT, syscall.SIGTERM)

	go killTime(quit)

	server := initializeAPI()

	listener, err := server.HTTPListener()
	if err != nil {
		panic(err)
	}

	PluginAuthor := "Massalabs"
	PluginName := "hello world"
	PluginDescription := "A simple hello world plugin."

	plugin.RegisterPlugin(listener, plugin.Info{
		Name: PluginName, Author: PluginAuthor,
		Description: PluginDescription, APISpec: "", Logo: logoFile,
	})

	if err := server.Serve(); err != nil {
		panic(err)
	}

	<-intSig
	quit <- true
}
