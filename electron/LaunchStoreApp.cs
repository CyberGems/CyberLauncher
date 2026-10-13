using System;
using System.Runtime.InteropServices;
using System.Text;

// Explorer is a shell broker: its exit code does not report Store app activation.
// Use Windows' activation HRESULT and process ID instead:
// https://learn.microsoft.com/windows/win32/api/shobjidl_core/nf-shobjidl_core-iapplicationactivationmanager-activateapplication
internal static class StoreAppLauncher
{
    [ComImport, Guid("2E941141-7F97-4756-BA1D-9DECDE894A3D")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IApplicationActivationManager
    {
        [PreserveSig]
        int ActivateApplication(
            [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId,
            [MarshalAs(UnmanagedType.LPWStr)] string arguments,
            uint options, out uint processId);
        [PreserveSig]
        int ActivateForFile(
            [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId, IntPtr items,
            [MarshalAs(UnmanagedType.LPWStr)] string verb, out uint processId);
        [PreserveSig]
        int ActivateForProtocol(
            [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId, IntPtr items,
            out uint processId);
    }

    [DllImport("ole32.dll")]
    private static extern int CoAllowSetForegroundWindow(
        [MarshalAs(UnmanagedType.IUnknown)] object manager, IntPtr reserved);

    [STAThread]
    private static int Main(string[] args)
    {
        Console.OutputEncoding = new UTF8Encoding(false);
        if (args.Length != 1 || String.IsNullOrWhiteSpace(args[0]))
        {
            Console.Error.WriteLine("An application user model ID is required.");
            return 1;
        }

        object manager = null;
        try
        {
            manager = Activator.CreateInstance(Type.GetTypeFromCLSID(
                new Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C")));
            // Transfer foreground rights only to the activation manager, when permitted.
            // Lack of foreground permission must not prevent launching (e.g. scheduled tasks).
            CoAllowSetForegroundWindow(manager, IntPtr.Zero);
            uint processId;
            // AO_NOERRORUI: the launcher presents failures through its own UI.
            int result = ((IApplicationActivationManager)manager).ActivateApplication(
                args[0], null, 2, out processId);
            if (result < 0)
            {
                Console.Error.WriteLine("0x" + result.ToString("X8") + ": " +
                    Marshal.GetExceptionForHR(result).Message);
                return 1;
            }
            if (processId == 0)
            {
                Console.Error.WriteLine("Windows did not return an activated process.");
                return 1;
            }
            Console.WriteLine(processId);
            return 0;
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("0x" + error.HResult.ToString("X8") + ": " + error.Message);
            return 1;
        }
        finally
        {
            if (manager != null && Marshal.IsComObject(manager))
                Marshal.ReleaseComObject(manager);
        }
    }
}
