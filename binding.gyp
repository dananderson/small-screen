{
  "targets": [
    {
      'variables': {
        'sdl_library_path%': '/usr/lib',
        'sdl_include_path%': '/usr/include/SDL2'
      },
      "target_name": "small-screen",
      'include_dirs': [
        "<!@(node -p \"require('node-addon-api').include\")",
        "deps/napi-thread-safe-callback",
        "deps/concurrentqueue",
        "deps/nanosvg",
        "deps/stb",
        "deps/base64",
        "<(sdl_include_path)"
      ],
      'cflags!': [ '-fno-exceptions' ],
      'cflags+': [ '-pthread' ],
      'cflags_cc!': [ '-fno-exceptions' ],
      'xcode_settings': {
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
        'CLANG_CXX_LIBRARY': 'libc++',
        'MACOSX_DEPLOYMENT_TARGET': '10.7',
      },
      'msvs_settings': {
        'VCCLCompilerTool': { 'ExceptionHandling': 1 },
      },
      'conditions': [
        [
          'OS=="win"', {
            'defines': [
              '_WIN32',
              '_HAS_EXCEPTIONS=1'
            ]
          }
        ]
      ],
      "sources": [
        "src/SDLBindings.cc",
        "src/ImageLoader.cc",
        "src/Image.cc",
        "src/Graphics.cc",
        "src/Init.cc",
      ],
      "libraries": [
        "-L<(sdl_library_path)",
        "-lSDL2"
      ],
      'dependencies': [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
    }
  ]
}
