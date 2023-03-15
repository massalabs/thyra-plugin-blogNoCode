package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
)

const ThyraRegisterEndpoint = "http://my.massa/plugin-manager/register"

type Info struct {
	Name        string
	Author      string
	Description string
	APISpec     string
	Logo        string
}

type registerBody struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Author      string `json:"author"`
	Description string `json:"description"`
	Logo        string `json:"logo"`
	URL         string `json:"url"`
	APISpec     string `json:"api_spec"`
	Home        string `json:"home"`
}

func RegisterPlugin(listener net.Listener, info Info) {
	if os.Getenv("STANDALONE") == "1" {
		return
	}

	minimumNumberOfCLIArgument := 2

	if len(os.Args) >= minimumNumberOfCLIArgument {
		err := register(os.Args[1], info, listener.Addr())
		if err != nil {
			log.Panicln(err)
		}
	} else {
		panic("Usage: program must be started with a correlationID command line argument")
	}
}

func register(
	pluginID string,
	info Info,
	socket net.Addr,
) error {
	reg := registerBody{
		ID:          pluginID,
		Name:        info.Name,
		Author:      info.Author,
		Description: info.Description,
		URL:         "http://" + socket.String(),
		APISpec:     info.APISpec,
		Logo:        info.Logo,
		Home:        "",
	}

	body, err := json.Marshal(reg)
	if err != nil {
		return fmt.Errorf("while marshaling register body: %w", err)
	}

	request, err := http.NewRequestWithContext(context.Background(), http.MethodPost, ThyraRegisterEndpoint, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("while creating register request: %w", err)
	}

	request.Header.Set("Content-Type", "application/json; charset=UTF-8")

	client := &http.Client{}

	response, err := client.Do(request)
	if err != nil {
		return fmt.Errorf("while doing register request: %w", err)
	}

	if response.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(response.Body)
		defer response.Body.Close()

		var data interface{}

		err = json.Unmarshal(body, &data)
		if err != nil {
			data = fmt.Errorf("unable to decode json response: %w", err)
		}

		return fmt.Errorf("plugin registry failed: HTTP status: %d, HTTP body: %v", response.StatusCode, data)
	}

	return nil
}
