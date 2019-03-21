{
  "variables": {
    "with_sdl_mixer%": "false",
    "sdl_library_path%": "/usr/local/lib",
    "sdl_include_path%": "/usr/local/include/SDL2",
    "sdl_mixer_include_path%": "<(sdl_include_path)",
    "sdl_mixer_library_path%": "<(sdl_library_path)"
  },
  "targets": [
    {
      "target_name": "common",
      "type": "static_library",
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "deps/nanosvg",
        "deps/stb",
        "deps/utf8_v2_3_4",
        "src/include"
      ],
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.7"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      },
      "conditions": [
        [
          "OS==\"win\"",
          {
            "defines": [
              "_WIN32",
              "_HAS_EXCEPTIONS=1"
            ]
          }
        ]
      ],
      "sources": [
        "src/common/Util.cc",
        "src/common/Font.cc",
        "src/common/FontSample.cc",
        "src/common/TextLayout.cc",
        "src/common/CapInsets.cc",
        "src/common/nanosvg.cc"
      ]
    },
    {
      "target_name": "small-screen-lib",
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "deps/napi-thread-safe-callback",
        "deps/concurrentqueue",
        "deps/nanosvg",
        "deps/stb",
        "deps/utf8_v2_3_4",
        "src/include"
      ],
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.7"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      },
      "conditions": [
        [
          "OS==\"win\"",
          {
            "defines": [
              "_WIN32",
              "_HAS_EXCEPTIONS=1"
            ]
          }
        ]
      ],
      "sources": [
        "src/small-screen-lib/AsyncTaskQueue.cc",
        "src/small-screen-lib/stb.cc",
        "src/small-screen-lib/StbFont.cc",
        "src/small-screen-lib/StbFontSample.cc",
        "src/small-screen-lib/FontStore.cc",
        "src/small-screen-lib/LoadImageAsyncTask.cc",
        "src/small-screen-lib/SmallScreenLib.cc"
      ],
      "libraries": [
        "<(PRODUCT_DIR)/common.a"
      ]
    },
    {
      "target_name": "small-screen-sdl",
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "<(sdl_include_path)",
        "deps/utf8_v2_3_4",
        "deps/nanosvg",
        "src/include"
      ],
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.7"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      },
      "conditions": [
        [
          "OS==\"win\"",
          {
            "defines": [
              "_WIN32",
              "_HAS_EXCEPTIONS=1"
            ]
          }
        ]
      ],
      "sources": [
        "src/small-screen-sdl/RoundedRectangleEffect.cc",
        "src/small-screen-sdl/SDLClient.cc",
        "src/small-screen-sdl/SDLRenderingContext.cc",
        "src/small-screen-sdl/SDLAudioContext.cc",
        "src/small-screen-sdl/SDLGamepad.cc",
        "src/small-screen-sdl/SDLBindings.cc",
        "src/small-screen-sdl/Init.cc"
      ],
      "libraries": [
        "-L<(sdl_library_path)",
        "-lSDL2",
        "<(PRODUCT_DIR)/common.a"
      ]
    }
  ],
  "conditions": [
    [
      "with_sdl_mixer==\"true\"",
      {
        "targets": [
          {
            "target_name": "small-screen-sdl-mixer",
            "include_dirs": [
              "<!@(node -p \"require('node-addon-api').include\")",
              "<(sdl_include_path)",
              "<(sdl_mixer_include_path)",
              "src/include"
            ],
            "cflags!": [
              "-fno-exceptions"
            ],
            "cflags_cc!": [
              "-fno-exceptions"
            ],
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LIBRARY": "libc++",
              "MACOSX_DEPLOYMENT_TARGET": "10.7"
            },
            "msvs_settings": {
              "VCCLCompilerTool": {
                "ExceptionHandling": 1
              }
            },
            "conditions": [
              [
                "OS==\"win\"",
                {
                  "defines": [
                    "_WIN32",
                    "_HAS_EXCEPTIONS=1"
                  ]
                }
              ]
            ],
            "sources": [
              "src/small-screen-sdl-mixer/SDLMixerAudioContext.cc",
              "src/small-screen-sdl-mixer/Init.cc"
            ],
            "libraries": [
              "-L<(sdl_mixer_library_path)",
              "-lSDL2_mixer"
            ]
          }
        ]
      }
    ]
  ]
}
