/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef FORMAT_H
#define FORMAT_H

#include <string>
#include <sstream>

// throw std::exception(Format() << "x = " << 100);
// throw std::exception(Format() << "x = " << 100 >> Format::to_str);

class Format
{
    public:

    Format() {}
    ~Format() {}

    template <typename Type>
    Format & operator << (const Type & value) {
        stream_ << value;
        return *this;
    }

    std::string str() const {
        return stream_.str();
    }

    operator std::string () const {
        return stream_.str();
    }

    enum ConvertToString {
        to_str
    };

    std::string operator >> (ConvertToString) {
        return stream_.str();
    }

private:
    std::stringstream stream_;

    Format(const Format &);
    Format & operator = (Format &);
};

#endif
