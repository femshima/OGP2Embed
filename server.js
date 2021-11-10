const fs = require("fs");
const childProcess = require('child_process')

console.log("Starting(server.js)");

//check if there is changes
const gitVer = childProcess.execSync('git rev-parse HEAD').toString();
console.log("gitVer:", gitVer);
let isNewVer = true;
if (fs.existsSync(".gitver")) {
    const oldgitVer = fs.readFileSync(".gitver").toString();
    if (oldgitVer === gitVer) {
        isNewVer = false;
    }
}
fs.writeFileSync(".gitver", gitVer);

if (isNewVer) {
    try {
        console.log("building...");
        const result = childProcess.execSync('npm run build');
        console.log(result.toString('utf8'));
    } catch (e) {
        console.log("build(err):", e);
        return;
    }
}

console.log("starting...");
const program = childProcess.spawn("npm", ["run", "start"], { shell: true });
program.stdout.pipe(process.stdout);
program.stderr.pipe(process.stderr);