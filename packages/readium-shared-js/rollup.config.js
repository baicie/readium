import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import { defineConfig } from "rollup";
const pkg = require("./package.json");
import { globSync } from "fast-glob";
import del from "rollup-plugin-delete";

const plugins = [
    del({ targets: ["dist/*"] }),
    babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
        presets: ["@babel/preset-env"],
        plugins: ["transform-amd-to-commonjs"]
    }),
    resolve(),
    json(),
    commonjs({
        // include: "node_modules/**"
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
