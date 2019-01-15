/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef ASYNCTASKQUEUE_H
#define ASYNCTASKQUEUE_H

#include "AsyncTask.h"

namespace AsyncTaskQueue {
    void Join();
    int GetThreadPoolSize();
    void SetThreadPoolSize(size_t size);
    void Enqueue(AsyncTask *task);
    void Close();
}

#endif
