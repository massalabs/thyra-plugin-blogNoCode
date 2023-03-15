# thyra-plugin-hello-world

This repository show case how to create a plugin for Thyra.

It is a simple plugin that only display "Hello world".

It contains a go package user by the other plugins to register them-self to Thyra plugin manager: `pkg/plugin/register.go`
Here is how to use it in your plugin:

```golang
plugin.RegisterPlugin(listener, plugin.Info{
    Name: PluginName, Author: PluginAuthor,
    Description: PluginDescription, APISpec: "", Logo: logoFile,
})
```

These commands will help you build and manually install this plugin (for development purpose only):

```shell
    go build -o hello-world thyra-plugin-hello-world.go
    mkdir -p ~/.config/thyra/my_plugins/hello-world
    mv hello-world ~/.config/thyra/my_plugins/hello-world
```
