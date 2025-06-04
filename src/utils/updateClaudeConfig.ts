import {existsSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import os from 'os';

type MCPConfig = {
    mcpServers: Record<
        string,
        {
            command: string;
            args?: string[];
            cwd?: string;
        }
    >;
};

function getClaudeConfigPath(): string {
    const home = os.homedir();

    switch (process.platform) {
        case 'darwin':
            // macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
            return join(
                home,
                'Library',
                'Application Support',
                'Claude',
                'claude_desktop_config.json'
            );

        case 'win32':
            // Windows: %APPDATA%\Claude\claude_desktop_config.json
            const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
            return join(appData, 'Claude', 'claude_desktop_config.json');

        case 'linux':
            // Linux: ~/.config/Claude/claude_desktop_config.json
            return join(home, '.config', 'Claude', 'claude_desktop_config.json');

        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
}

function loadConfig(path: string): MCPConfig {
    if (!existsSync(path)) {
        console.error(`File not found: ${path}`);
        process.exit(1);
    }
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw) as MCPConfig;
}

function saveConfig(path: string, cfg: MCPConfig) {
    const pretty = JSON.stringify(cfg, null, 2);
    writeFileSync(path, pretty, 'utf8');
}

export function addOrUpdateMCPServer(name: string, serverEntry: MCPConfig['mcpServers'][string]) {
    const configPath = getClaudeConfigPath();
    const config = loadConfig(configPath);

    config.mcpServers = {
        ...config.mcpServers,
        [name]: serverEntry,
    };

    saveConfig(configPath, config);
    console.log(`Updated "${name}" in ${configPath}`);
}
