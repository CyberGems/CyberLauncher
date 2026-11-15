using System;
using System.Runtime.InteropServices;
using System.Text;

internal static class Program
{
    [DllImport("user32.dll")]
    private static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);

    [DllImport("user32.dll")]
    private static extern bool GetCursorPos(out POINT point);

    [DllImport("user32.dll")]
    private static extern IntPtr OpenInputDesktop(uint flags, bool inherit, uint access);

    [DllImport("user32.dll")]
    private static extern bool CloseDesktop(IntPtr desktop);

    [DllImport("user32.dll")]
    private static extern IntPtr GetThreadDesktop(uint threadId);

    [DllImport("kernel32.dll")]
    private static extern uint GetCurrentThreadId();

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern bool GetUserObjectInformation(IntPtr handle, int index, StringBuilder name, int bytes, out int needed);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromPoint(POINT pt, uint dwFlags);

    [DllImport("user32.dll")]
    private static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    private static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder lpClassName, int nMaxCount);

    [DllImport("shell32.dll")]
    private static extern int SHQueryUserNotificationState(out int pquns);

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT { public int Left, Top, Right, Bottom; }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT { public int X, Y; }

    [StructLayout(LayoutKind.Sequential)]
    private struct MONITORINFO
    {
        public int cbSize;
        public RECT rcMonitor;
        public RECT rcWork;
        public uint dwFlags;
    }

    private const uint MONITOR_DEFAULTTONEAREST = 2;
    private const uint DESKTOP_READOBJECTS = 1;
    private const int UOI_NAME = 2;
    private static readonly IntPtr DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = new IntPtr(-4);

    private static bool ReadDesktopName(IntPtr desktop, StringBuilder name)
    {
        int needed;
        return desktop != IntPtr.Zero && GetUserObjectInformation(desktop, UOI_NAME, name, name.Capacity * sizeof(char), out needed);
    }

    private static bool TryReadCursor(string threadDesktop, StringBuilder name, out POINT point)
    {
        point = new POINT();
        IntPtr input = OpenInputDesktop(0, false, DESKTOP_READOBJECTS);
        if (input == IntPtr.Zero) return false;

        try
        {
            return ReadDesktopName(input, name) && name.ToString() == threadDesktop && GetCursorPos(out point);
        }
        finally
        {
            CloseDesktop(input);
        }
    }

    private static int ServeHotspotCursor()
    {
        // Electron converts the physical cursor coordinates to its per-display DIP space.
        if (SetThreadDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2) == IntPtr.Zero) return 2;
        var name = new StringBuilder(256);
        if (!ReadDesktopName(GetThreadDesktop(GetCurrentThreadId()), name)) return 2;
        string threadDesktop = name.ToString();

        string request;
        while ((request = Console.ReadLine()) != null)
        {
            POINT point;
            if (!TryReadCursor(threadDesktop, name, out point))
            {
                Console.WriteLine("unavailable");
                continue;
            }

            string fullscreen = "-";
            if (request == "fullscreen")
            {
                bool blocked = IsFullscreen(point, true);
                POINT updated;
                if (!TryReadCursor(threadDesktop, name, out updated))
                {
                    Console.WriteLine("unavailable");
                    continue;
                }
                if (point.X == updated.X && point.Y == updated.Y) fullscreen = blocked ? "1" : "0";
                point = updated;
            }
            Console.WriteLine("{0} {1} {2}", point.X, point.Y, fullscreen);
        }
        return 0;
    }

    public static int Main(string[] args)
    {
        if (args.Length == 1 && args[0] == "--hotspot-cursor") return ServeHotspotCursor();
        try
        {
            POINT pt = new POINT();
            bool hasPoint = args.Length >= 2 && int.TryParse(args[0], out pt.X) && int.TryParse(args[1], out pt.Y);
            return IsFullscreen(pt, hasPoint) ? 1 : 0;
        }
        catch
        {
            return 0;
        }
    }

    private static bool IsFullscreen(POINT pt, bool hasPoint)
    {
        IntPtr fg = GetForegroundWindow();
        if (fg == IntPtr.Zero) return false;

        var sb = new StringBuilder(256);
        GetClassName(fg, sb, 256);
        string cls = sb.ToString();
        if (cls == "Progman" || cls == "WorkerW" || cls == "Shell_TrayWnd")
        {
            return false;
        }

        IntPtr fgMon = MonitorFromWindow(fg, MONITOR_DEFAULTTONEAREST);
        if (fgMon == IntPtr.Zero) return false;

        if (hasPoint)
        {
            IntPtr cursorMon = MonitorFromPoint(pt, MONITOR_DEFAULTTONEAREST);
            if (cursorMon != IntPtr.Zero && cursorMon != fgMon)
            {
                return false;
            }
        }

        MONITORINFO mi = new MONITORINFO();
        mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
        if (!GetMonitorInfo(fgMon, ref mi)) return false;

        RECT r = new RECT();
        if (!GetWindowRect(fg, out r)) return false;

        bool isFsBounds = (r.Left <= mi.rcMonitor.Left &&
                           r.Top <= mi.rcMonitor.Top &&
                           r.Right >= mi.rcMonitor.Right &&
                           r.Bottom >= mi.rcMonitor.Bottom);

        if (isFsBounds)
        {
            return true;
        }

        int quns;
        if (SHQueryUserNotificationState(out quns) == 0)
        {
            if (quns == 3 || quns == 4)
            {
                return true;
            }
        }

        return false;
    }
}
