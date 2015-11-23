/* eslint no-console:0 */

const rollup = require("rollup").rollup;
const babel = require("rollup-plugin-babel");

const input = {
  entry: "lib/index.js",
  external: ["jvent"],
  plugins: [
    babel()
  ]
};

const output = {
  dest: "dist/drive-in.js",
  format: "cjs"
};

rollup(input).then((bundle) => bundle.write(output)).catch(console.error);
