import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// 0. Verify x64 mode
const nodeArch = execSync("node -p 'process.arch'").toString().trim();
if (nodeArch !== "x64") {
    console.error("❌ Error: Node.js must run in x64 mode (use Rosetta Terminal)");
    process.exit(1);
}

// 1. Clean and compile
fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist");
execSync("tsc", { stdio: "inherit" });

// 2. Generate SEA blob
const seaConfig = {
    main: path.resolve("dist/server.js"),
    output: path.resolve("dist/sea-prep.blob"),
    disableExperimentalSEAWarning: true,
};
fs.writeFileSync("dist/sea-config.json", JSON.stringify(seaConfig));
execSync("node --experimental-sea-config dist/sea-config.json", { stdio: "inherit" });

// 3. Copy Node binary (x64)
const nodePath = execSync("command -v node").toString().trim();
execSync(`cp ${nodePath} dist/server`, { stdio: "inherit" });

// 4. Inject SEA blob (no code-signing changes needed for x64)
try {
    execSync(
        `npx postject@latest dist/server NODE_SEA_BLOB dist/sea-prep.blob ` +
            `--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6 ` +
            `--macho-segment-name NODE_SEA`,
        { stdio: "inherit" }
    );
} catch (error) {
    console.error("❌ Postject failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
}

// 5. Make executable
fs.chmodSync("dist/server", 0o755);
console.log("✅ Single Executable App created: dist/server (x64)");
