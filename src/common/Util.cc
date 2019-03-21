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

#define R 0
#define G 1
#define B 2
#define A 3
#define NUM_IMAGE_COMPONENTS 4

inline void swap(unsigned char *bytes, int a, int b) {
    unsigned char t = bytes[a];

    bytes[a] = bytes[b];
    bytes[b] = t;
}

inline void ToFormatLE(unsigned char *bytes, int len, TextureFormat format) {
    auto i = 0;
    unsigned char r, g, b, a;

    switch(format) {
        case TEXTURE_FORMAT_ARGB:
            while (i < len) {
                swap(bytes, i + R, i + B);
                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_BGRA:
            while (i < len) {
                r = bytes[i + R];
                g = bytes[i + G];
                b = bytes[i + B];
                a = bytes[i + A];

                bytes[i    ] = a;
                bytes[i + 1] = r;
                bytes[i + 2] = g;
                bytes[i + 3] = b;

                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_RGBA:
            while (i < len) {
                swap(bytes, i + R, i + A);
                swap(bytes, i + G, i + B);

                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        default:
            // TEXTURE_FORMAT_ABGR - no op in LE
            break;
    }

}

inline void ToFormatBE(unsigned char *bytes, int len, TextureFormat format) {
    auto i = 0;
    unsigned char r, g, b, a;

    switch(format) {
        case TEXTURE_FORMAT_ABGR:
            while (i < len) {
                swap(bytes, i + A, i + R);
                swap(bytes, i + G, i + B);
                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_ARGB:
            while (i < len) {
                r = bytes[i + R];
                g = bytes[i + G];
                b = bytes[i + B];
                a = bytes[i + A];

                bytes[i    ] = a;
                bytes[i + 1] = r;
                bytes[i + 2] = g;
                bytes[i + 3] = b;

                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_BGRA:
            while (i < len) {
                swap(bytes, i + R, i + B);
                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_RGBA:
        default:
            // TEXTURE_FORMAT_RGBA - noop in BE
            break;
    }
}

void ConvertToFormat(unsigned char *bytes, int len, TextureFormat format) {
    if (IsBigEndian()) {
       ToFormatBE(bytes, len, format);
    } else {
       ToFormatLE(bytes, len, format);
    }
}
