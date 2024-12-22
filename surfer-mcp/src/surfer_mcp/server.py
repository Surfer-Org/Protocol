import asyncio
from mcp.server.models import InitializationOptions
import mcp.types as types
from mcp.server import NotificationOptions, Server
from pydantic import AnyUrl
import mcp.server.stdio
import chromadb
from chromadb.utils import embedding_functions
import os
import requests
import json

embedding_function = embedding_functions.DefaultEmbeddingFunction

if os.name == "nt":
    user_data_path = os.path.expanduser("~/AppData/Roaming/Electron")
else:
    user_data_path = os.path.expanduser("~/Library/Application Support/Electron")

persistent_dir = os.path.join(user_data_path, "vector_db")
if not os.path.exists(persistent_dir):
    os.makedirs(persistent_dir)

client = chromadb.PersistentClient(path=persistent_dir)

collection_name = "surfer_collection"
existing_collections = client.list_collections()
collection_exists = any(coll.name == collection_name for coll in existing_collections)

if not collection_exists:
    collection = client.create_collection(
        name=collection_name,
        metadata={"description": "Main collection for Surfer data"}
    )
else:
    collection = client.get_collection(collection_name)

existing_chunks = collection.get()
names_array = list(set(chunk['name'] for chunk in existing_chunks['metadatas']))

# Store notes as a simple key-value dict to demonstrate state management
notes: dict[str, str] = {}

server = Server("surfer-mcp")

@server.list_resources()
async def handle_list_resources() -> list[types.Resource]:
    """
    List available note resources.
    Each note is exposed as a resource with a custom note:// URI scheme.
    """
    return [
        types.Resource(
            uri=AnyUrl(f"note://internal/{name}"),
            name=f"Note: {name}",
            description=f"A simple note named {name}",
            mimeType="text/plain",
        )
        for name in notes
    ]

@server.read_resource()
async def handle_read_resource(uri: AnyUrl) -> str:
    """
    Read a specific note's content by its URI.
    The note name is extracted from the URI host component.
    """
    if uri.scheme != "note":
        raise ValueError(f"Unsupported URI scheme: {uri.scheme}")

    name = uri.path
    if name is not None:
        name = name.lstrip("/")
        return notes[name]
    raise ValueError(f"Note not found: {name}")

@server.list_prompts()
async def handle_list_prompts() -> list[types.Prompt]:
    """
    List available prompts.
    Each prompt can have optional arguments to customize its behavior.
    """
    return [
        types.Prompt(
            name="summarize-notes",
            description="Creates a summary of all notes",
            arguments=[
                types.PromptArgument(
                    name="style",
                    description="Style of the summary (brief/detailed)",
                    required=False,
                )
            ],
        )
    ]

@server.get_prompt()
async def handle_get_prompt(
    name: str, arguments: dict[str, str] | None
) -> types.GetPromptResult:
    """
    Generate a prompt by combining arguments with server state.
    The prompt includes all current notes and can be customized via arguments.
    """
    if name != "summarize-notes":
        raise ValueError(f"Unknown prompt: {name}")

    style = (arguments or {}).get("style", "brief")
    detail_prompt = " Give extensive details." if style == "detailed" else ""

    return types.GetPromptResult(
        description="Summarize the current notes",
        messages=[
            types.PromptMessage(
                role="user",
                content=types.TextContent(
                    type="text",
                    text=f"Here are the current notes to summarize:{detail_prompt}\n\n"
                    + "\n".join(
                        f"- {name}: {content}"
                        for name, content in notes.items()
                    ),
                ),
            )
        ],
    )

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """
    List available tools.
    Each tool specifies its arguments using JSON Schema validation.
    """
    return [
        types.Tool(
            name="search",
            description="Semantic search over data from Surfer. The options for platform are the following: " + ", ".join(names_array) + ". Only use the platform that corresponds to the data you are searching over.",

            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "platform": {"type": "string"},
                },
                "required": ["query", "platform"],
            },
        )
    ]

@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """
    Handle tool execution requests.
    Tools can modify server state and notify clients of changes.
    """
    if name == "search":
        query = arguments.get("query")
        platform = arguments.get("platform")

        # send a request to the surfer api to search for the query
        health_response = requests.get(f"http://localhost:2024/api/health")
        if health_response.status_code != 200:
            raise ValueError("Make sure the Surfer desktop app is running!")

        search_response = requests.get(f"http://localhost:2024/api/search/{query}/{platform}")
        search_data = search_response.json()  # Parse the JSON response

        return [
            types.TextContent(
                type="text",
                text=f"Given the following similar documents, answer the question to the best of your ability: {query}\n\n{json.dumps(search_data, indent=2)}",
            )
        ]

async def main():
    # Run the server using stdin/stdout streams
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="surfer-mcp",
                server_version="0.1.3",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )