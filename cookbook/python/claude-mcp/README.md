# Claude MCP

1. Install the <a target="_blank" href="https://claude.ai/download">Claude Desktop App</a>

3. Install <a target="_blank" href="https://docs.astral.sh/uv/getting-started/installation/">uv</a>. This is recommended for managing model context protocol servers. More details can be found <a target="_blank" href="https://modelcontextprotocol.io/quickstart/server">here</a>.

4. If not already there, create a `claude_desktop_config.json` file in the app data folder of the Claude desktop app. 

Mac Path: `~/Library/Application Support/Claude/claude_desktop_config.json`

Windows Path: `C:/Users/[your-username]/AppData/Roaming/Claude/claude_desktop_config.json`

5. Add the following content to the file and save it:


```json
{
  "mcpServers": {
    "surfer-mcp": {
      "command": "uvx",
      "args": [
        "surfer-mcp"
      ]
    }
  }
}
```

6. Close the Claude Desktop app and run it again. If you see a plug and tool icon in the chat window, you should be good to go!
