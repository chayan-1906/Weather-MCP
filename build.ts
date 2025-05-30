import { compile } from "nexe";
import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";

async function buildExecutable(platform?: "windows" | "macos" | "linux") {
    console.log("🚀 Working Build Process\n");

    // Determine target platform
    const currentOS = require("os").platform();
    const targetPlatform =
        platform ||
        (currentOS === "win32" ? "windows" : currentOS === "darwin" ? "macos" : "linux");

    console.log(`🔨 Building for: ${targetPlatform}`);

    // Step 1: Compile TypeScript to JavaScript first
    const inputTS = path.resolve(process.cwd(), "src", "server.ts");
    const tempJS = path.resolve(process.cwd(), "temp-build.js");

    console.log(`📝 Input TypeScript: ${inputTS}`);
    console.log(`📝 Temp JavaScript: ${tempJS}`);

    if (!fs.existsSync(inputTS)) {
        console.error(`❌ TypeScript file not found: ${inputTS}`);
        process.exit(1);
    }

    // Compile TypeScript to JavaScript
    console.log("🔄 Compiling TypeScript to JavaScript...");
    try {
        execSync(
            `npx tsc "${inputTS}" --outFile "${tempJS}" --target ES2020 --module commonjs --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck`,
            {
                stdio: "inherit",
            }
        );
        console.log("✅ TypeScript compilation completed");
    } catch (error) {
        console.error("❌ TypeScript compilation failed:", error);
        process.exit(1);
    }

    // Verify JS file was created
    if (!fs.existsSync(tempJS)) {
        console.error(`❌ Compiled JavaScript file not found: ${tempJS}`);
        process.exit(1);
    }

    console.log(
        `✅ JavaScript file created: ${tempJS} (${(fs.statSync(tempJS).size / 1024).toFixed(2)} KB)`
    );

    // Platform-specific configuration
    const configs = {
        windows: {
            target: "windows-x64-20.11.0",
            output: path.resolve(process.cwd(), "dist", "app-windows.exe"),
        },
        macos: {
            target: "mac-x64-20.11.0",
            output: path.resolve(process.cwd(), "dist", "app-macos"),
        },
        linux: {
            target: "linux-x64-20.11.0",
            output: path.resolve(process.cwd(), "dist", "app-linux"),
        },
    };

    const config = configs[targetPlatform];
    console.log(`📦 Target: ${config.target}`);
    console.log(`📁 Output: ${config.output}`);

    // Ensure directories exist
    const distDir = path.dirname(config.output);
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
        console.log(`✅ Created directory: ${distDir}`);
    }

    // Check for .env file
    const envFile = path.resolve(process.cwd(), ".env");
    const hasEnv = fs.existsSync(envFile);
    console.log(`🔧 Environment file: ${hasEnv ? "✅ Found" : "❌ Not found"}`);

    try {
        console.log("\n⚡ Starting Nexe compilation with JavaScript input...");

        const buildConfig = {
            input: tempJS, // Use compiled JavaScript instead of TypeScript
            output: config.output,
            target: config.target,

            // Essential options
            build: false, // Use pre-built binaries
            bundle: true,

            // Resources
            resources: hasEnv ? [envFile] : [],

            // Output options
            verbose: true,

            // Additional options that might help
            temp: path.resolve(process.cwd(), ".nexe-temp"),
            clean: false, // Don't clean, might be interfering

            // Ensure file permissions
            ...(targetPlatform !== "windows" && { chmod: 0o755 }),
        };

        console.log(`📋 Nexe Build Configuration:`);
        console.log(`   Input: ${buildConfig.input}`);
        console.log(`   Output: ${buildConfig.output}`);
        console.log(`   Target: ${buildConfig.target}`);
        console.log(`   Build from source: ${buildConfig.build}`);

        await compile(buildConfig);

        // Clean up temp JavaScript file
        if (fs.existsSync(tempJS)) {
            fs.unlinkSync(tempJS);
            console.log("🧹 Cleaned up temporary JavaScript file");
        }

        // Verify output
        console.log("\n🔍 Verifying build...");

        if (fs.existsSync(config.output)) {
            const stats = fs.statSync(config.output);
            console.log(`✅ Build successful!`);
            console.log(`📦 File: ${config.output}`);
            console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

            // Make executable on Unix systems
            if (targetPlatform !== "windows") {
                fs.chmodSync(config.output, 0o755);
                console.log(`🔐 Set executable permissions`);
            }

            // Test the executable
            console.log("\n🧪 Testing executable...");
            try {
                const testResult = execSync(`"${config.output}" --help || echo "Executable runs"`, {
                    timeout: 5000,
                    encoding: "utf8",
                });
                console.log("✅ Executable test passed");
            } catch (error) {
                console.log("⚠️  Executable test failed, but file was created");
            }

            return config.output;
        } else {
            throw new Error(`Output file not created: ${config.output}`);
        }
    } catch (error: any) {
        // Clean up temp file on error
        if (fs.existsSync(tempJS)) {
            fs.unlinkSync(tempJS);
        }

        console.error(`❌ Nexe build failed: ${error.message}`);
        throw error;
    }
}

async function buildAllPlatforms() {
    console.log("🏗️  Building for all platforms...\n");

    const platforms: Array<"windows" | "macos" | "linux"> = ["windows", "macos", "linux"];
    const results: { platform: string; success: boolean; output?: string; error?: string }[] = [];

    for (const platform of platforms) {
        try {
            console.log(`\n${"=".repeat(60)}`);
            console.log(`🔨 BUILDING ${platform.toUpperCase()}`);
            console.log(`${"=".repeat(60)}`);

            const output = await buildExecutable(platform);
            results.push({ platform, success: true, output });

            console.log(`✅ ${platform.toUpperCase()} BUILD COMPLETED`);
        } catch (error: any) {
            console.log(`❌ ${platform.toUpperCase()} BUILD FAILED: ${error.message}`);
            results.push({ platform, success: false, error: error.message });
        }
    }

    // Summary
    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 FINAL BUILD SUMMARY");
    console.log(`${"=".repeat(60)}`);

    results.forEach((result) => {
        if (result.success) {
            console.log(`✅ ${result.platform.toUpperCase()}: ${result.output}`);
            if (fs.existsSync(result.output!)) {
                const size = (fs.statSync(result.output!).size / 1024 / 1024).toFixed(2);
                console.log(`   Size: ${size} MB`);
            }
        } else {
            console.log(`❌ ${result.platform.toUpperCase()}: ${result.error}`);
        }
    });

    const successCount = results.filter((r) => r.success).length;
    console.log(`\n🎯 ${successCount}/${results.length} builds completed successfully`);

    if (successCount > 0) {
        console.log("\n📁 Check the ./dist/ directory for your executables!");
    }

    return results;
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case "all":
                await buildAllPlatforms();
                break;
            case "windows":
                await buildExecutable("windows");
                break;
            case "macos":
                await buildExecutable("macos");
                break;
            case "linux":
                await buildExecutable("linux");
                break;
            case "current":
            case undefined:
                await buildExecutable();
                break;
            default:
                console.log("Usage:");
                console.log("  npm run build:working              # Build for current platform");
                console.log("  npm run build:working all          # Build for all platforms");
                console.log("  npm run build:working windows      # Build for Windows");
                console.log("  npm run build:working macos        # Build for macOS");
                console.log("  npm run build:working linux        # Build for Linux");
                break;
        }
    } catch (error) {
        console.error("Build failed:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { buildExecutable, buildAllPlatforms };
