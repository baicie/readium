import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import { defineConfig } from "rollup";
const pkg = require("./package.json");
import { globSync } from "fast-glob";

const plugins = [
    babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
        presets: ["@babel/preset-env"],
    }),
    resolve(),
    commonjs({
        include: "node_modules/**",
    }),
    json(),
    terser(),
];

const inputs = globSync("src/**/*.js", {
    onlyFiles: true,
    absolute: false,
});

const standardConfig = defineConfig({
    input: inputs,
    output: [
        {
            format: "es",
            dir: "dist/es",
            preserveModules: true,
            preserveModulesRoot: "src",
        },
        {
            format: "cjs",
            dir: "dist/cjs",
            preserveModules: true,
            preserveModulesRoot: "src",
        },
    ],
    plugins,
    external: ["jquery"],
});

export default [standardConfig];
