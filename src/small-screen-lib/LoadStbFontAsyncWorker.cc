/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "LoadStbFontAsyncWorker.h"
#include "Format.h"
#include "StbFont.h"
#include <stdexcept>
#include <cstdio>
#include <stb_truetype.h>

using namespace Napi;

struct FileHandle {
    FILE *fp;

    FileHandle(const std::string filename, const char *flags) {
        this->fp = fopen(filename.c_str(), flags);

        if (!this->fp) {
            throw std::runtime_error(Format() << "Font file not found: " << filename);
        }
    }

    ~FileHandle() {
        if (this->fp) {
            fclose(this->fp);
        }
    }

    operator FILE*() { return this->fp; }
};

LoadStbFontAsyncWorker::LoadStbFontAsyncWorker(Napi::Env env, const std::string filename)
    : AsyncWorker(Function::New(env, [](const CallbackInfo& info){})),
      promise(Promise::Deferred::New(env)),
      filename(filename),
      count(0) {

}

void LoadStbFontAsyncWorker::Execute() {
    auto fileHandle = FileHandle(this->filename, "rb");

    fseek(fileHandle, 0, SEEK_END);

    auto size = ftell(fileHandle);

    if (size == -1) {
        throw std::runtime_error(Format() << "Font file access error: " << this->filename);
    }

    fseek(fileHandle, 0, SEEK_SET);

    auto buffer = new uint8_t[size];

    this->ttf = std::shared_ptr<uint8_t>(buffer, std::default_delete<uint8_t[]>());

    if (fread(buffer, 1, size, fileHandle) != static_cast<size_t>(size)) {
        throw std::runtime_error(Format() << "Font file read error: " << this->filename);
    }

    this->count = stbtt_GetNumberOfFonts(buffer);

    if (this->count <= 0) {
        throw std::runtime_error(Format() << "Failed to parse font file: " << this->filename);
    }
}

void LoadStbFontAsyncWorker::OnOK() {
    auto env = this->Env();
    auto collection = Array::New(env, this->count);
    auto len = collection.Length();

    for (auto i = 0u; i < len; i++) {
        collection[i] = StbFont::New(env, i, this->ttf);
    }

    this->promise.Resolve(collection);
}

Value LoadStbFontAsyncWorker::Promise() {
    return this->promise.Promise();
}

void LoadStbFontAsyncWorker::OnError(const Error& e) {
    this->promise.Reject(e.Value());
}
