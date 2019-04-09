/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

'use strict'

import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import { builtinModules } from 'module'
import fs from 'fs'
import path from 'path'

const input = 'lib/export.js'
const file = 'cjs/small-screen.%env.js'

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')))
const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
  ...builtinModules,
  'fbjs/lib/emptyObject',
  'fbjs/lib/emptyFunction'
]

const resolveOpts = {
  mainFields: [ 'jsnext:main', 'main' ],
  browser: false,
  preferBuiltins: true
}

const babelOpts = {
  ...JSON.parse(fs.readFileSync(path.join(__dirname, '.babelrc'))),
  babelrc: false,
  exclude: ['node_modules/**']
}

babelOpts.presets.forEach(preset => {
  if (Array.isArray(preset) && preset.length >= 2 && preset[0] === '@babel/preset-env') {
    preset[1].modules = false
  }
})

const commonjsOpts = {
  exclude: ['/**/node_modules/**']
}

const onwarn = warning => {
  throw new Error(warning.message)
}

export default [
  {
    input,
    output: {
      format: 'cjs',
      file: file.replace('%env', 'development')
    },
    external,
    plugins: [
      resolve(resolveOpts),
      babel({ ...babelOpts, comments: true }),
      commonjs(commonjsOpts)
    ],
    onwarn
  },
  {
    input,
    output: {
      format: 'cjs',
      file: file.replace('%env', 'production'),
      sourcemap: true
    },
    external,
    plugins: [
      resolve(resolveOpts),
      babel({ ...babelOpts }),
      commonjs(commonjsOpts),
      terser({
        mangle: {
          module: true,
          reserved: [ 'bindings' ],
          keep_classnames: /AbortSignal/
        },
        compress: {
          ecma: 8,
          passes: 3,
          collapse_vars: false,
          module: true,
          unsafe: true,
          reduce_funcs: false,
          inline: false,
          keep_classnames: /AbortSignal/
        },
        output: {
          ecma: 8,
          quote_style: 1,
          semicolons: false,
          wrap_iife: true
        }
      })
    ],
    onwarn
  }
]
