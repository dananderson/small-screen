/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Util.h"

#include <iterator>
#include <string>
#include <fstream>
#include <exception>
#include <iostream>
#include "Format.h"

void ReadBytesFromFile(const std::string filename, std::vector<unsigned char>& target) {
    std::ifstream file(filename, std::ios_base::binary);

    file.unsetf(std::ios::skipws);
    file.seekg(0, std::ios_base::end);

    auto length = file.tellg();

    if (length <= 0) {
        throw std::runtime_error(Format() << "File not found for " << filename);
    }

    file.seekg(0, std::ios_base::beg);

    target.clear();
    target.reserve(length);
    target.insert(target.begin(), std::istream_iterator<unsigned char>(file), std::istream_iterator<unsigned char>());

    if (target.size() != (size_t)length) {
        throw std::runtime_error(Format() << "Failed to read file contents of " << filename);
    }
}
