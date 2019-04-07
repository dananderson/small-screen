/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import bindings from 'bindings'

const lib = bindings('small-screen-lib')

export const FontStore = lib.FontStore
export const CapInsets = lib.CapInsets
export const TextLayout = lib.TextLayout
export const loadImage = lib.loadImage
export const releaseImage = lib.releaseImage
