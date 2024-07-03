import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import { defineConfig } from "rollup";
import replace from "@rollup/plugin-replace";
const pkg = require("./package.json");
import del from "rollup-plugin-delete";

const plugins = [
    del({ targets: ["dist/*"] }),
    replace({
        preventAssignment: true,
        __buildVersion__: JSON.stringify(pkg.version)
    }),
    babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
        presets: ["@babel/preset-env"],
        plugins: ["transform-amd-to-commonjs"]
    }),
    resolve(),
    commonjs({
        esmExternals: true
    }),
    json()
    // terser(),
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
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {})
    ]
});

export default [standardConfig];
