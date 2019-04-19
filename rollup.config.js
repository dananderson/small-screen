/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import autoExternal from 'rollup-plugin-auto-external'
import { readFileSync } from 'fs'
import { join } from 'path'

// The modules field in env preset must be set to false when running rollup so commonjs can process the import statements.
const babelPreserveImports = () => {
  const rc = JSON.parse(readFileSync(join(__dirname, '.babelrc')))

  rc.presets.find(preset => Array.isArray(preset) && preset.length >= 2 && preset[0] === '@babel/preset-env')[1].modules = false

  return babel({
    ...rc,
    babelrc: false,
    exclude: ['node_modules/**']
  })
}

const beautify = () => terser({
  compress: false,
  mangle: false,
  output: {
    ecma: 8,
    quote_style: 1,
    semicolons: false,
    beautify: true,
    preamble:
      '/*' +
      ' * Copyright (C) 2019 Daniel Anderson.' +
      ' * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.' +
      ' */'
  }
})

const baseConfig = {
  input: 'lib/export.js',
  external: [
    // autoExternal does not catch these nested imports.
    'fbjs/lib/emptyObject',
    'fbjs/lib/emptyFunction'
  ],
  onwarn (warning, warn) {
    warn(warning)
    // Stop the CI build for any warnings during rollup.
    throw Error('Stopping rollup due to warning: ' + warning.message)
  }
}

export default [
  {
    ...baseConfig,
    output: {
      format: 'cjs',
      file: 'cjs/small-screen.js'
    },
    plugins: [
      autoExternal(),
      resolve(),
      babelPreserveImports(),
      commonjs({
        exclude: ['/**/node_modules/**']
      }),
      beautify()
    ]
  },
  {
    ...baseConfig,
    output: {
      format: 'esm',
      file: 'esm/small-screen.mjs'
    },
    plugins: [
      autoExternal(),
      resolve(),
      babelPreserveImports(),
      beautify()
    ]
  }
]
