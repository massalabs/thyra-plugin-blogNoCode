package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/go-openapi/loads"
	"github.com/massalabs/thyra-plugin-blogNoCode/api/server/restapi"
	"github.com/massalabs/thyra-plugin-blogNoCode/api/server/restapi/operations"
	"github.com/massalabs/thyra-plugin-blogNoCode/pkg/plugin"
	"github.com/massalabs/thyra-plugin-blogNoCode/web"
)

const logoFile = "web/logo_web.svg"

func killTime(quit chan bool) {
	fmt.Fprintf(os.Stdout, "Plugin is initializing.")

	<-quit // Wait for a value to be sent on the quit channel

	fmt.Fprintf(os.Stdout, "Plugin is shutting down.\nBye!\n")
}

func initializeAPI() *restapi.Server {
	swaggerSpec, err := loads.Analyzed(restapi.SwaggerJSON, "")
	if err != nil {
		panic(err)
	}

	pluginAPI := operations.NewBlogNocodeAPI(swaggerSpec)
	server := restapi.NewServer(pluginAPI)

	pluginAPI.WebHandler = operations.WebHandlerFunc(web.Handle)
	pluginAPI.DefaultPageHandler = operations.DefaultPageHandlerFunc(web.DefaultRedirectHandler)

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
	PluginName := "Website Builder No-Code"
	PluginDescription := "Build and deploy simple websites on Massa blockchain with 0 coding skills"

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
