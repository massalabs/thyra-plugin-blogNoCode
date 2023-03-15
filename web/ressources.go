package web

import (
	"embed"
	"fmt"
)

const basePath = "content/"

//go:embed content
var content embed.FS

func Content(resource string) ([]byte, error) {
	content, err := content.ReadFile(basePath + resource)
	if err != nil {
		return nil, fmt.Errorf("while reading %s in %s: %w", resource, basePath, err)
	}

	return content, nil
}
