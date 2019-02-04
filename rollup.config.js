/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

'use strict'

import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import minify from 'rollup-plugin-babel-minify'
import { builtinModules } from 'module'
import fs from 'fs'
import path from 'path'

const input = 'lib/export.js'
const file = 'dist/small-screen.%env.js'

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')))
const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
  ...builtinModules,
  'fbjs/lib/emptyObject',
  'fbjs/lib/emptyFunction'
]

const resolveOpts = {
  jsnext: true,
  main: true,
  browser: false,
  preferBuiltins: true
}

const babelOpts = {
  ...JSON.parse(fs.readFileSync(path.join(__dirname, '.babelrc'))),
  babelrc: false,
  exclude: ['node_modules/**']
}

babelOpts.presets.forEach(preset => {
  if (Array.isArray(preset) && preset.length >= 2 && preset[0] === 'env') {
    preset[1].modules = false
  }
})

const commonjsOpts = {
  exclude: ['/**/node_modules/**']
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
    ]
  },
  {
    input,
    output: {
      format: 'cjs',
      file: file.replace('%env', 'production')
    },
    external,
    plugins: [
      resolve(resolveOpts),
      babel({ ...babelOpts, comments: false }),
      commonjs(commonjsOpts),
      minify()
    ]
  }
]
