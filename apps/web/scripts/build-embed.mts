// Bundles embed/loader.ts into public/embed.js (git-ignored). `--watch` keeps rebuilding while the
// dev server runs and exits when the process that started it goes away.
import * as esbuild from "esbuild";

const options: esbuild.BuildOptions = {
  entryPoints: ["embed/loader.ts"],
  outfile: "public/embed.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2019",
  legalComments: "none",
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const context = await esbuild.context(options);
  await context.watch();
  const parent = process.ppid;
  setInterval(() => {
    try {
      process.kill(parent, 0);
    } catch {
      void context.dispose().then(() => process.exit(0));
    }
  }, 2000);
} else {
  await esbuild.build(options);
}
