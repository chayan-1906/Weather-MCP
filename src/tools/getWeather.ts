import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";

async function getWeatherByCity(city: string) {
    if (city.toLowerCase() === "patiala") {
        return {temp: "30°C", forecast: "Chances of high rain"};
    }
    if (city.toLowerCase() === "delhi") {
        return {temp: "20°C", forecast: "Chances of high warm winds"};
    }
    return {temp: null, forecast: "Unable to fetch data"};
}

export const registerTool = (server: McpServer) => {
    server.tool(
        'getWeatherByCity',
        'Gets weather of the given city',
        {
            city: z.string().describe('City name'),
        },
        async ({city}) => {
            const response = await getWeatherByCity(city);
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: JSON.stringify(response, null, 2),
                    },
                ],
            };
        },
    );
}
