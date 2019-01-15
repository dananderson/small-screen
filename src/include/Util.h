/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef UTIL_H
#define UTIL_H

#include <arpa/inet.h>
#include <string>

inline bool IsBigEndian() {
    return htonl(47) == 47;
}

bool ReadFileContents(const std::string& filename, unsigned char **data, size_t *dataSize);

#endif
