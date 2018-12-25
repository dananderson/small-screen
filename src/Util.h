/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef UTIL_H
#define UTIL_H

#include <arpa/inet.h>

inline bool IsBigEndian() {
    return htonl(47) == 47;
}

#endif
