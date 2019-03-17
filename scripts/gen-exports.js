/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

console.log = () => {}

const fs = require('fs')
const path = require('path')
const smallScreen = require(path.join(__dirname, '..'))
const exportsPath = path.join(__dirname, '..', 'cjs/exports.js')

fs.writeFileSync(exportsPath, 'module.exports = ' + JSON.stringify(Object.keys(smallScreen)))
