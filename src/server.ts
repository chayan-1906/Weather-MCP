import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {z} from 'zod';

// Create an MCP server
const server = new McpServer({
    name: 'Weather Data Fetcher',
    version: '1.0.0',
});

async function getWeatherByCity(city: string) {
    // const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPEN_WEATHER_MAP_API_KEY}&units=metric`);
    /*const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=b4d4bb028b0d666876ecfba6cabe947c&units=metric`);
    const responseData = response.data;
    if (responseData.status === 200) {
        const forecast = responseData.list[0].main;
        return {
            temp: forecast.temp,
            forecast,
            error: responseData,
        }
    } else {
        return {
            temp: null,
            forecast: 'Unable to fetch data',
            error: responseData,
        }
    }*/

    if (city.toLowerCase() === 'patiala') {
        return {
            temp: '30°C',
            forecast: 'Chances of high rain',
        }
    }
    if (city.toLowerCase() === 'delhi') {
        return {
            temp: '20°C',
            forecast: 'Chances of high warm winds',
        }
    }
    return {
        temp: null,
        forecast: 'Unable to fetch data',
    }
}

// Add an addition tool
server.tool('getWeatherByCity', {
    city: z.string(),
}, async ({city}: { city: string }) => {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(await getWeatherByCity(city)),
            },
        ],
    };
});

// Start receiving messages on stdin and sending messages on stdout
async function init() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

init();
