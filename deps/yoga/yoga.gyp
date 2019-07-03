{
  "targets": [
    {
      "target_name": "yoga",
      "type": "static_library",
      "include_dirs": [
        "include"
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
        "lib/log.cpp",
        "lib/Utils.cpp",
        "lib/YGConfig.cpp",
        "lib/YGEnums.cpp",
        "lib/YGLayout.cpp",
        "lib/YGMarker.cpp",
        "lib/YGNode.cpp",
        "lib/YGNodePrint.cpp",
        "lib/YGStyle.cpp",
        "lib/YGValue.cpp",
        "lib/Yoga.cpp",
      ]
    },
  ]
}
