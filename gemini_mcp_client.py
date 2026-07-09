import asyncio
import os
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from google import genai
from google.genai import types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running this script.")

client = genai.Client(api_key=GEMINI_API_KEY)

# Point to the local MCP joke server (stdio transport)
server_params = StdioServerParameters(
    command="node",
    args=["local-mcp-server-example.js"],
)


async def run():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Show discovered tools
            tools_result = await session.list_tools()
            print("Discovered MCP tools:")
            for tool in tools_result.tools:
                print(f"  - {tool.name}: {tool.description}")
            print()

            # Send a prompt to Gemini, giving it access to the MCP session as a tool
            user_prompt = "Tell me a funny joke about programming"
            print(f"User prompt: {user_prompt}")
            print("Asking Gemini (with MCP tool access)...\n")

            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    temperature=0,
                    tools=[session],
                ),
            )

            print(f"Gemini response:\n{response.text}")


if __name__ == "__main__":
    asyncio.run(run())
