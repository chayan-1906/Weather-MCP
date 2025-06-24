import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {registerTool as getWeather} from '../tools/getWeather';

async function setupMcpTools(server: McpServer) {

    getWeather(server);
}

export {setupMcpTools}
