/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export const number = p => typeof p === 'number' && !Number.isNaN(p)
export const string = p => typeof p === 'string'
export const int = p => typeof p === 'number' && p % 1 === 0
export const boolean = p => typeof p === 'boolean'
