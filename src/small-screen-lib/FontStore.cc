/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Font.h"

#include <cstdio>
#include <string>

#define CMP_BMFONT_IMPLEMENTATION
#include <cmp_bmfont.cpp>

#define STB_TRUETYPE_IMPLEMENTATION
#include <stb_truetype.h>

using namespace Napi;

struct FileContents {
    unsigned char *data;
    size_t size;
};

bool LoadFileContents(const std::string& filename, FileContents *contents) {
    auto file = fopen(filename.c_str(), "rb");

    if (!file) {
        return false;
    }

    fseek(file, 0, SEEK_END);
    auto size = (int)ftell(file);
    fseek(file, 0, SEEK_SET);

    auto data = new unsigned char[size];

    if (!data) {
        fclose(file);
        return false;
    }

    if (fread(data, 1, size, file) != (unsigned long)size) {
        delete [] data;
        fclose(file);
        return false;
    }

    contents->data = data;
    contents->size = size;

    fclose(file);

    return true;
}

void FreeFileContents(FileContents *contents) {
    if (contents && contents->data) {
        delete [] contents->data;
        contents->data = nullptr;
    }
}

class Font : public Napi::ObjectWrap<Font> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  Font(const Napi::CallbackInfo& info);

 private:
  static Napi::FunctionReference constructor;
  std::string familyName;

  Napi::Value GetFamilyName(const Napi::CallbackInfo& info);
};

FunctionReference Font::constructor;

Napi::Object Font::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "Font", {
    InstanceMethod("getFamilyName", &Font::GetFamilyName),
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Font", func);

  return exports;
}

Font::Font(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Font>(info)  {
    auto file = info[0].As<String>().Utf8Value();
    auto font = cmp::bmfont_parse_file(file.c_str());

    if (font) {

        this->familyName = std::string(font->font_name);
        cmp::bmfont_free(font);
    } else {
        fprintf(stderr, "Failed to load font file. Reason: %s\n", cmp::bmfont_get_error_string());
        // Other error handling goes here, including a return, exit, etc.

        FILE* fp = NULL;
        size_t size;
        unsigned char* data = NULL;

        fp = fopen(file.c_str(), "rb");
        if (fp) {
            fseek(fp, 0, SEEK_END);
            size = ftell(fp);
            fseek(fp, 0, SEEK_SET);
            data = new unsigned char[size+1];

            if (data) {
                if (fread(data, 1, size, fp) == size) {
                    data[size] = '\0';	// Must be null terminated.

                    stbtt_fontinfo font;

                    const unsigned char *ttf = data;

                    if (!stbtt_InitFont(&font, ttf, stbtt_GetFontOffsetForIndex(ttf,0))) {
                        fprintf(stdout, "Failed to init ttf file\n");
                    } else {
                        fprintf(stdout, "Opened ttf file\n");
//                        const char *name;
//                        int len = 0;
//
//                        name = stbtt_GetFontNameString(&font, &len, STBTT_PLATFORM_ID_MAC, 0, 0, 1);
//                        char target[32] = "";
//                        strncpy ( target, name, len ) ;
//                        fprintf(stdout, "%s - %i\n", name, len);
                    }
                }
            }

            fclose(fp);
        } else {
            fprintf(stdout, "Failed to open ttf file\n");
        }
    }
}

Napi::Value Font::GetFamilyName(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
//  Napi::HandleScope scope(env);

  return Napi::String::New(env, this->familyName);
}

Value JS_InstallFont(const CallbackInfo& info) {

    // family, weight (normal, bold), style (normal, italic),
    
    auto filename = info[0].As<String>().Utf8Value();
    auto bmf = cmp::bmfont_parse_file(filename.c_str());

    if (bmf) {
        fprintf(stdout, "Successfully loaded bitmap font.\n");
    } else {
        FileContents contents;

        if (!LoadFileContents(filename, &contents)) {
            throw Error::New(info.Env(), "Failed to load font file.");
        }

        auto ttf = contents.data;
        stbtt_fontinfo font;

        if (stbtt_InitFont(&font, ttf, stbtt_GetFontOffsetForIndex(ttf, 0))) {
            fprintf(stdout, "Successfully loaded true type font.\n");
        } else {
            fprintf(stdout, "Failed to load font file.\n");
        }

        FreeFileContents(&contents);
    }

    return info.Env().Undefined();
}

Value JS_FindFontMetrics(const CallbackInfo& info) {
    return info.Env().Undefined();
}

Object FontInit(Env env, Object exports) {
    exports["installFont"] = Function::New(env, JS_InstallFont, "installFont");
    exports["findFontMetrics"] = Function::New(env, JS_FindFontMetrics, "findFontMetrics");

    Font::Init(env, exports);

    return exports;
}
