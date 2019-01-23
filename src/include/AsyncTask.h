/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef ASYNCTASK_H
#define ASYNCTASK_H

#include <string>

class AsyncTask {
public:
    virtual ~AsyncTask() {}

    virtual void Run() = 0;
    virtual void Dispatch() = 0;
    virtual void DispatchError(const std::string& message) = 0;
};

#endif
