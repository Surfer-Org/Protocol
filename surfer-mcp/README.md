# surfer-mcp MCP server

This is the official MCP server for Surfer

## Components

### Tools

The server implements one tool:
- search: Searches for documents in Surfer
  - Takes "query" and "platform" as required string arguments and returns a list of documents that match the query

## Configuration

[TODO: Add configuration details specific to your implementation]

## Prerequisites

### Windows
- Microsoft Visual C++ Build Tools is required for building dependencies
- Install from: [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - During installation, ensure "Desktop development with C++" is selected

### Install

#### Claude Desktop

On MacOS: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

<details>
  <summary>Development/Unpublished Servers Configuration</summary>
  ```
  "mcpServers": {
    "surfer-mcp": {
      "command": "uv",
      "args": [
        "--directory",
        "/Users/sahil/Documents/Surfer-Protocol/surfer-mcp",
        "run",
        "surfer-mcp"
      ]
    }
  }
  ```
</details>

<details>
  <summary>Published Servers Configuration</summary>
  ```
  "mcpServers": {
    "surfer-mcp": {
      "command": "uvx",
      "args": [
        "surfer-mcp"
      ]
    }
  }
  ```
</details>

## Development

### Building and Publishing

To prepare the package for distribution:

1. Sync dependencies and update lockfile:
```bash
uv sync
```

2. Build package distributions:
```bash
uv build
```

This will create source and wheel distributions in the `dist/` directory.

3. Publish to PyPI:
```bash
uv publish
```

Note: You'll need to set PyPI credentials via environment variables or command flags:
- Token: `--token` or `UV_PUBLISH_TOKEN`
- Or username/password: `--username`/`UV_PUBLISH_USERNAME` and `--password`/`UV_PUBLISH_PASSWORD`

### Debugging

Since MCP servers run over stdio, debugging can be challenging. For the best debugging
experience, we strongly recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).


You can launch the MCP Inspector via [`npm`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) with this command:

```bash
npx @modelcontextprotocol/inspector uv --directory /Users/sahil/Documents/Surfer-Protocol/surfer-mcp run surfer-mcp
```


Upon launching, the Inspector will display a URL that you can access in your browser to begin debugging.