import {McpServer} from "@modelcontextprotocol/sdk/server/mcp";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio";
import express from "express";
import {PORT} from "./config/config";
import * as z from "zod";

const app = express();
app.use(express.json());

const server = new McpServer({
    name: "Weather Data Fetcher",
    version: "1.0.0",
});

async function getWeatherByCity(city: string) {
    if (city.toLowerCase() === "patiala") {
        return {temp: "30°C", forecast: "Chances of high rain"};
    }
    if (city.toLowerCase() === "delhi") {
        return {temp: "20°C", forecast: "Chances of high warm winds"};
    }
    return {temp: null, forecast: "Unable to fetch data"};
}

server.tool(
    'getWeatherByCity',
    {city: (z.string() as any)}, // use zod under the hood
    async ({city}: { city: string }) => {
        const result = await getWeatherByCity(city);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result),
                },
            ],
        };
    }
);

async function init() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

app.listen(PORT, async () => {
    await init();
    console.log(`Weather MCP running on http://localhost:${PORT}`);
});
