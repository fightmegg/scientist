import babel from "rollup-plugin-babel";
import copy from 'rollup-plugin-copy'
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
    },
  ],
  plugins: [
    resolve(),
    babel({
      runtimeHelpers: true,
      exclude: /node_modules/,
    }),
    commonjs(),
    terser(),
    copy({
      targets: [
        { src: 'src/index.d.ts', dest: 'dist' }
      ]
    })
  ],
};
