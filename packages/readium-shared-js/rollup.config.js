import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import { defineConfig } from "rollup";
const pkg = require("./package.json");
import { globSync } from "fast-glob";
import amd from "rollup-plugin-amd";

const plugins = [
    resolve(),
    json(),
    amd(),
    commonjs({
        esmExternals: true
    })
    // terser(),
];

const inputs = globSync("src/**/*.js", {
    onlyFiles: true,
    absolute: false
});

const standardConfig = defineConfig({
    input: inputs,
    output: [
        {
            format: "es",
            dir: "dist/es",
            preserveModules: true,
            preserveModulesRoot: "src",
            sourcemap: true
        },
        {
            format: "cjs",
            dir: "dist/cjs",
            preserveModules: true,
            preserveModulesRoot: "src",
            sourcemap: true
        }
    ],
    plugins,
    external: ["jquery"]
});

export default [standardConfig];
