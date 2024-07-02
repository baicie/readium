import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import { defineConfig } from "rollup";
import replace from "@rollup/plugin-replace";
const pkg = require("./package.json");

const plugins = [
    replace({
        preventAssignment: true,
        __buildVersion__: JSON.stringify(pkg.version),
    }),
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
    // terser(),
];

const standardConfig = defineConfig({
    input: "src/index.js",
    output: [
        {
            file: pkg.module,
            format: "es",
            // sourcemap: true,
        },
    ],
    plugins,
});

const compatibilityConfig = defineConfig({
    input: "src/index.js",
    output: [
        {
            file: pkg.main,
            format: "umd",
            name: "EPUBcfi",
            // sourcemap: true,
        },
    ],
    plugins,
});

export default [standardConfig, compatibilityConfig];
