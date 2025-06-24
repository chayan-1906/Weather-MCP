import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio";
import express from "express";
import {PORT} from "./config/config";
import * as z from "zod";
import {addOrUpdateMCPServer} from "./utils/updateClaudeConfig";
import {setupMcpTools} from "./controllers/ToolsController";

const app = express();
app.use(express.json());

const server = new McpServer({
    name: "Weather Data Fetcher",
    version: "1.0.0",
});

async function init() {
    await setupMcpTools(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

const serverName = 'weather-mcp';
const entry = {
    command: process.execPath,  // e.g. "C:\\Users\\USER\Downloads\\weather-mcp.exe" or "/Users/padmanabhadas"
    args: [],
    cwd: process.cwd(),         // wherever the user launched it from
};

app.listen(PORT, async () => {
    await init();
    addOrUpdateMCPServer(serverName, entry);
    console.log(`Weather MCP running on http://localhost:${PORT}`);
});
