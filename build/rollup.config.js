import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.js',
  output: {
    format: 'cjs',
    file: 'index.js'
  },
  plugins: [ babel() ],
  external: ['lodash']
}