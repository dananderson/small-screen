/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Creates a font ID used for identifying font resources.
 *
 * @param family Font family string.
 * @param size Font size.
 * @returns {string}
 */
export const fontId = (family, size) => family + '-' + size
