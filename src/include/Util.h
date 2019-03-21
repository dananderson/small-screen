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
#include "TextureFormat.h"

inline bool IsBigEndian() {
    uint32_t i = 1;
    return ! *((uint8_t *)&i);
}

inline int clamp(float i) {
    return floor(i + 0.5f);
}

inline bool EndsWith(std::string const & value, std::string const & ending) {
    if (ending.size() > value.size()) {
        return false;
    }
    
    return std::equal(ending.rbegin(), ending.rend(), value.rbegin());
}

inline std::string GetDirectory(const std::string& str) {
  std::size_t found;

  found = str.find_last_of('/');

  if (found == std::string::npos) {
    return str;
  }

  return str.substr(0,found);
}

inline std::string GetBasename(const std::string& str) {
  std::size_t found;

  found = str.find_last_of('/');

  if (found == std::string::npos) {
    return str;
  }

  return str.substr(found + 1);
}

void ReadBytesFromFile(const std::string filename, std::vector<unsigned char>& target);
void ConvertToFormat(unsigned char *bytes, int len, TextureFormat format);

#endif
