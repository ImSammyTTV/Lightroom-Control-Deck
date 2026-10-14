import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/plugin.ts",
  output: { file: "com.lightroom-control-deck.sdPlugin/bin/plugin.js", format: "es", sourcemap: true },
  external: [/^node:/],
  plugins: [typescript({ tsconfig: "./tsconfig.json" }), json(), nodeResolve({ browser: false, exportConditions: ["node"], preferBuiltins: true }), commonjs()],
};
