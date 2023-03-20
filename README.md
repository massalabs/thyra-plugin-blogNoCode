# thyra-plugin-BlogNoCode

It allows to create and deploy website without coding skills

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
    go build -o blogNoCode thyra-plugin-blogNoCode.go
    mkdir -p ~/.config/thyra/my_plugins/blogNoCode
    mv blogNoCode ~/.config/thyra/my_plugins/blogNoCode
```
