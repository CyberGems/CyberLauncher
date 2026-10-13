# Windows Store app activation

Store shortcuts use an application user model ID (AUMID). They are activated through Windows' IApplicationActivationManager, not by interpreting explorer.exe's exit code. Explorer can return 1 after successfully handing the launch to Windows, which previously produced a false launch-error notification for WhatsApp.

The native helper returns a process ID only after successful activation. Failed activation returns a nonzero exit code and Windows' HRESULT/detail. The Electron backend passes the AUMID as a literal argument using execFile, requires a valid returned process ID, and propagates real errors through the existing launch result. Existing app-card, tray and scheduled launch callers share this backend.

electron/LaunchStoreApp.cs and its checked-in launch-store-app.exe follow the repository's existing native-helper convention. After editing the C# source, rebuild it on Windows with:

    npm run build:store-launcher

This uses the installed .NET Framework compiler. End users do not need a compiler. electron-builder copies the executable into resources/launch-store-app.exe for installed and portable builds. Development resolves it relative to the compiled main process or project directory; the isolated review host is also supported.

Run regression checks with:

    npm run test:store-launcher
    npm run lint
    npm run build

Tests never open a real app by default. To opt into a live activation test, set TEST_STORE_APP_ID to an installed AUMID before running the tests.

Verification on this machine: the original Explorer command returned exit code 1 while WhatsApp had an open window. Native activation succeeded for the configured WhatsApp AUMID. The compiled Electron main process returned success through IPC; clicking the real app card in an isolated profile incremented its usage counter and produced the normal WhatsApp launch notification. An uninstalled Store package returned 0x80073CF1, and a missing executable retained the not-found result. Literal shell metacharacters did not execute commands.

Successful activation confirms that Windows accepted the launch contract and identified the app process. It does not guarantee that an application will remain healthy afterward. A new installer/portable executable was not generated for this fix.
