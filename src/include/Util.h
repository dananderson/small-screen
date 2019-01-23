/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef UTIL_H
#define UTIL_H

#include <cstdint>
#include <string>
#include <vector>
#include <cmath>

inline bool IsBigEndian() {
    uint32_t i = 1;
    return ! *((uint8_t *)&i);
}

inline int clamp(float i) {
    return floor(i + 0.5f);
}

void ReadBytesFromFile(const std::string filename, std::vector<unsigned char>& target);

#endif
