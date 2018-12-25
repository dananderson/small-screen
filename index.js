/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/small-screen.production.js')
} else {
  module.exports = require('./dist/small-screen.development.js')
}
