const babel = require("rollup-plugin-babel");

export default {
  entry: "lib/index.js",
  external: ["jvent"],
  plugins: [babel()],
  dest: "dist/drive-in.js",
  format: "cjs"
};
