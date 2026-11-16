{
  'targets': [{
    'target_name': 'cyberbot-dpi-win32',
    'sources': ['cyberbot-dpi-win32.cpp'],
    'defines': ['NAPI_VERSION=8', 'WIN32_LEAN_AND_MEAN', '_WIN32_WINNT=0x0A00'],
    'libraries': ['user32.lib', 'comctl32.lib'],
    'msvs_settings': { 'VCCLCompilerTool': { 'RuntimeLibrary': 0 } },
  }],
}
