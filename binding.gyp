{
  "variables": {
    "with_sdl_mixer%": "false",
    "with_cec%": "false",
    "sdl_library_path%": "/usr/local/lib",
    "sdl_include_path%": "/usr/local/include/SDL2",
    "sdl_mixer_include_path%": "<(sdl_include_path)",
    "sdl_mixer_library_path%": "<(sdl_library_path)",
    "cec_include_path%": "/usr/include",
    "cec_library_path%": "/usr/lib"
  },
  "targets": [
    {
      "target_name": "common",
      "type": "static_library",
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "deps/utf8_v2_3_4",
        "src/include",
        "deps/yoga/lib"
      ],
      "dependencies": [
        "deps/stb_truetype/stb_truetype.gyp:stb_truetype",
        "deps/nanosvg/nanosvg.gyp:nanosvg",
        "deps/yoga/yoga.gyp:yoga",
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
        "src/common/YogaValue.cc",
        "src/common/YogaNode.cc",
        "src/common/YogaGlobal.cc",
      ]
    },
    {
      "target_name": "small-screen-lib",
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "deps/nanosvg/include",
        "deps/stb_truetype/include",
        "deps/stb_image/include",
        "deps/fmt/include",
        "deps/utf8_v2_3_4",
        "src/include",
        "src/small-screen-core/include",
        "deps/yoga/lib"
      ],
      "dependencies": [
        "deps/stb_image/stb_image.gyp:stb_image",
        "deps/nanosvg/nanosvg.gyp:nanosvg",
        "src/small-screen-core/small-screen-core.gyp:small-screen-core",
        "deps/fmt/fmt.gyp:fmt",
        "common",
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
        "src/small-screen-lib/StbFont.cc",
        "src/small-screen-lib/StbFontSample.cc",
        "src/small-screen-lib/LoadImageAsyncWorker.cc",
        "src/small-screen-lib/LoadStbFontAsyncWorker.cc",
        "src/small-screen-lib/LoadStbFontSampleAsyncWorker.cc",
        "src/small-screen-lib/Global.cc",
        "src/small-screen-lib/Init.cc"
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
    ],
    [
      "with_cec==\"true\"",
      {
        "targets": [
          {
            "target_name": "small-screen-cec",
            "include_dirs": [
              "<!@(node -p \"require('node-addon-api').include\")",
              "<(cec_include_path)",
              "src/include"
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
              "src/small-screen-cec/Init.cc"
            ],
            "libraries": [
              "-L<(cec_library_path)",
              "-lcec"
            ]
          }
        ]
      }
    ]
  ]
}
