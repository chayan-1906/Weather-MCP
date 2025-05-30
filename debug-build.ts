import { compile } from "nexe";
import * as path from "path";
import * as fs from "fs";

// Platform configurations
const platforms = {
    windows: {
        target: "windows-x64-20.11.0",
        output: "./dist/app-windows.exe",
        name: "Windows x64",
    },
    macos: {
        target: "mac-x64-20.11.0",
        output: "./dist/app-macos",
        name: "macOS x64",
    },
    linux: {
        target: "linux-x64-20.11.0",
        output: "./dist/app-linux",
        name: "Linux x64",
    },
};

// Debug function to check file system
function debugFileSystem(stage: string) {
    console.log(`\n🔍 Debug - ${stage}:`);

    // Check current directory
    console.log(`   Current directory: ${process.cwd()}`);

    // Check if dist exists and list contents
    const distPath = path.resolve("./dist");
    console.log(`   Dist path (resolved): ${distPath}`);

    if (fs.existsSync("./dist")) {
        console.log(`   ✅ Dist directory exists`);
        const files = fs.readdirSync("./dist");
        console.log(`   Contents: [${files.join(", ")}]`);

        // Show file details
        files.forEach((file) => {
            const filePath = path.join("./dist", file);
            const stats = fs.statSync(filePath);
            console.log(`     - ${file}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        });
    } else {
        console.log(`   ❌ Dist directory does not exist`);
    }

    // Check if src/server.ts exists
    if (fs.existsSync("./src/server.ts")) {
        console.log(`   ✅ Source file exists: ./src/server.ts`);
    } else {
        console.log(`   ❌ Source file missing: ./src/server.ts`);
    }
}

async function buildForPlatform(platform: keyof typeof platforms, hasEnvFile: boolean) {
    const config = platforms[platform];

    console.log(`\n🔨 Building for ${config.name}...`);
    console.log(`   Target: ${config.target}`);
    console.log(`   Output: ${config.output}`);
    console.log(`   Input: ./src/server.ts`);

    // Debug before build
    debugFileSystem(`Before ${config.name} build`);

    // Ensure dist directory exists with absolute path
    const distDir = path.resolve("./dist");
    const outputPath = path.resolve(config.output);

    console.log(`   Creating dist directory: ${distDir}`);
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
        console.log(`   ✅ Created dist directory`);
    } else {
        console.log(`   ✅ Dist directory already exists`);
    }

    // Build configuration
    const buildConfig = {
        input: path.resolve("./src/server.ts"),
        output: outputPath,
        target: config.target,
        build: false, // Use pre-built binaries
        bundle: true,

        // Include .env file if it exists
        resources: hasEnvFile ? [path.resolve(".env")] : [],

        // Debug configuration
        verbose: true, // Enable verbose logging
        temp: path.resolve("./.nexe-temp"),
        clean: true,

        // Ensure proper permissions
        chmod: 0o755,
    };

    console.log(`\n📋 Build Configuration:`);
    console.log(`   Input (resolved): ${buildConfig.input}`);
    console.log(`   Output (resolved): ${buildConfig.output}`);
    console.log(`   Target: ${buildConfig.target}`);
    console.log(
        `   Resources: ${buildConfig.resources.length > 0 ? buildConfig.resources : "None"}`
    );
    console.log(`   Temp: ${buildConfig.temp}`);

    try {
        console.log(`\n⚡ Starting Nexe compilation...`);

        await compile(buildConfig);

        console.log(`\n✅ Nexe compilation completed for ${config.name}`);

        // Debug after build
        debugFileSystem(`After ${config.name} build`);

        // Verify the specific output file
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`✅ Output file verified: ${outputPath}`);
            console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Permissions: ${(stats.mode & parseInt("777", 8)).toString(8)}`);

            // Test if file is executable (Unix systems)
            if (process.platform !== "win32") {
                try {
                    fs.accessSync(outputPath, fs.constants.X_OK);
                    console.log(`   ✅ File is executable`);
                } catch {
                    console.log(`   ⚠️  File is not executable, fixing...`);
                    fs.chmodSync(outputPath, 0o755);
                    console.log(`   ✅ Fixed file permissions`);
                }
            }

            return true;
        } else {
            console.error(`❌ Output file not found after build: ${outputPath}`);

            // Check if file was created elsewhere
            console.log(`\n🔍 Searching for created files...`);
            const possiblePaths = [
                path.resolve(config.output),
                path.join(process.cwd(), config.output),
                path.join(process.cwd(), "dist", path.basename(config.output)),
                config.output,
            ];

            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    console.log(`   ✅ Found file at: ${possiblePath}`);

                    // Move to correct location
                    if (possiblePath !== outputPath) {
                        fs.copyFileSync(possiblePath, outputPath);
                        console.log(`   📦 Moved file to: ${outputPath}`);
                    }
                    return true;
                } else {
                    console.log(`   ❌ Not found at: ${possiblePath}`);
                }
            }

            return false;
        }
    } catch (error: any) {
        console.error(`❌ ${config.name} build failed:`, error);

        // Show detailed error information
        if (error.message) {
            console.error(`   Error message: ${error.message}`);
        }
        if (error.stack) {
            console.error(`   Stack trace: ${error.stack}`);
        }

        // Debug after failed build
        debugFileSystem(`After failed ${config.name} build`);

        return false;
    }
}

async function buildAll() {
    console.log("🏗️  Debug Nexe Express App Builder\n");

    // Initial debug
    debugFileSystem("Initial state");

    // Validate Express app exists
    const appPath = "./src/server.ts";
    if (!fs.existsSync(appPath)) {
        console.error(`❌ Express app not found at ${appPath}`);

        // Show what files do exist in src
        if (fs.existsSync("./src")) {
            const srcFiles = fs.readdirSync("./src");
            console.log(`   Files in src/: [${srcFiles.join(", ")}]`);
        }

        process.exit(1);
    }

    // Check for .env file
    const envPath = path.join(process.cwd(), ".env");
    const hasEnvFile = fs.existsSync(envPath);

    console.log(`\n📋 Configuration:`);
    console.log(`   App: ${path.resolve(appPath)}`);
    console.log(`   Env: ${hasEnvFile ? `✅ Found at ${envPath}` : "❌ Not found"}`);
    console.log(`   Working directory: ${process.cwd()}`);

    // Clean any previous temp directories
    const tempDir = path.resolve("./.nexe-temp");
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`   🧹 Cleaned temp directory: ${tempDir}`);
    }

    const results: { [key: string]: boolean } = {};

    // Build for each platform
    for (const [platformKey, platformInfo] of Object.entries(platforms)) {
        const success = await buildForPlatform(platformKey as keyof typeof platforms, hasEnvFile);
        results[platformInfo.name] = success;
    }

    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Final debug
    debugFileSystem("Final state");

    // Summary
    console.log("\n📊 Build Summary:");
    console.log("================");

    let successCount = 0;
    for (const [platformName, success] of Object.entries(results)) {
        const status = success ? "✅ Success" : "❌ Failed";
        console.log(`${platformName}: ${status}`);
        if (success) successCount++;
    }

    console.log(
        `\n🎯 ${successCount}/${Object.keys(results).length} builds completed successfully`
    );

    if (successCount > 0) {
        console.log("\n📦 Executables created in ./dist/ directory");

        // Show final file listing
        if (fs.existsSync("./dist")) {
            const files = fs.readdirSync("./dist");
            console.log("\n📁 Final dist/ contents:");
            files.forEach((file) => {
                const filePath = path.join("./dist", file);
                const stats = fs.statSync(filePath);
                console.log(`   ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
            });
        }
    }
}

// Build current platform only
async function buildCurrent() {
    const os = require("os").platform();
    let platformKey: keyof typeof platforms;

    switch (os) {
        case "win32":
            platformKey = "windows";
            break;
        case "darwin":
            platformKey = "macos";
            break;
        case "linux":
            platformKey = "linux";
            break;
        default:
            console.error(`❌ Unsupported platform: ${os}`);
            process.exit(1);
    }

    console.log("🏗️  Debug Nexe Express App Builder - Current Platform\n");

    debugFileSystem("Initial state");

    const appPath = "./src/server.ts";
    if (!fs.existsSync(appPath)) {
        console.error(`❌ Express app not found at ${appPath}`);
        process.exit(1);
    }

    const envPath = path.join(process.cwd(), ".env");
    const hasEnvFile = fs.existsSync(envPath);

    const success = await buildForPlatform(platformKey, hasEnvFile);

    if (success) {
        console.log("\n🎉 Build completed successfully!");
    } else {
        console.error("\n❌ Build failed!");
        process.exit(1);
    }
}

// CLI handling
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case "all":
                await buildAll();
                break;
            case "current":
            case undefined:
                await buildCurrent();
                break;
            default:
                console.log("Usage:");
                console.log("  npm run build:debug           # Build for current platform");
                console.log("  npm run build:debug all       # Build for all platforms");
                break;
        }
    } catch (error) {
        console.error("Build process failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { buildAll, buildCurrent };
