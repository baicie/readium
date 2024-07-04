import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import { defineConfig } from "rollup";
import del from "rollup-plugin-delete";
const pkg = require("./package.json");

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
        include: "node_modules/**"
    })
];

const standardConfig = defineConfig({
    input: "src/index.js",
    output: [
        {
            file: pkg.module,
            format: "es",
            sourcemap: true
        },
        {
            file: pkg.main,
            format: "cjs",
            sourcemap: true
        }
    ],
    plugins,
    external: [...Object.keys(pkg.dependencies)]
});

export default [standardConfig];
