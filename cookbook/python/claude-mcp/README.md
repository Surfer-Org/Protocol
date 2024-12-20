# Claude MCP

1. Download the Claude Desktop App from https://claude.ai/download

2. If not already there, create a `claude_desktop_config.json` file in the app data folder of the Claude desktop app. The path for this on Mac is `~/Library/Application Support/Claude/claude_desktop_config.json`. And for Windows it is `C:/Users/username/AppData/Roaming/Claude/claude_desktop_config.json`.

3. Add the following content to the file:

Mac config:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "[insert-folder-path-of-your-choice-here]"
        ]
      }
    }
}
```

Windows config:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": [
        "C:/Users/username/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
        "[insert-folder-path-of-your-choice-here]"
      ]
    }
  }
}
```

**Note:** The path for the @modelcontextprotocol/server-filesystem package may vary based on your operating system. Look [here](https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem/README.md) for more details.

4. Restart the Claude Desktop App. You should see a plug and tool icon in the chat window:

5. You should be able to ask Claude about your data from Surfer. For example, you can ask it to read all the data in the exported folder and tell you what it found.

**Note:** Some files may be too large to read in full by Claude, so it may return an error for this. A solution is to implement a custom MCP server for Surfer that can read files in chunks or vectorize the data locally and expose that function to Claude. Check out the issue [here](https://github.com/Surfer-Org/Protocol/issues/15) for more details.
