using System;
using System.Runtime.InteropServices;

internal static class Program
{
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

    public static int Main(string[] args)
    {
        try
        {
            POINT pt = new POINT();
            bool hasPoint = false;
            if (args.Length >= 2 && int.TryParse(args[0], out pt.X) && int.TryParse(args[1], out pt.Y))
            {
                hasPoint = true;
            }

            IntPtr fg = GetForegroundWindow();
            if (fg == IntPtr.Zero) return 0;

            var sb = new System.Text.StringBuilder(256);
            GetClassName(fg, sb, 256);
            string cls = sb.ToString();
            if (cls == "Progman" || cls == "WorkerW" || cls == "Shell_TrayWnd")
            {
                return 0;
            }

            IntPtr fgMon = MonitorFromWindow(fg, MONITOR_DEFAULTTONEAREST);
            if (fgMon == IntPtr.Zero) return 0;

            if (hasPoint)
            {
                IntPtr cursorMon = MonitorFromPoint(pt, MONITOR_DEFAULTTONEAREST);
                if (cursorMon != IntPtr.Zero && cursorMon != fgMon)
                {
                    return 0;
                }
            }

            MONITORINFO mi = new MONITORINFO();
            mi.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
            if (!GetMonitorInfo(fgMon, ref mi)) return 0;

            RECT r = new RECT();
            if (!GetWindowRect(fg, out r)) return 0;

            bool isFsBounds = (r.Left <= mi.rcMonitor.Left &&
                               r.Top <= mi.rcMonitor.Top &&
                               r.Right >= mi.rcMonitor.Right &&
                               r.Bottom >= mi.rcMonitor.Bottom);

            if (isFsBounds)
            {
                return 1;
            }

            int quns;
            if (SHQueryUserNotificationState(out quns) == 0)
            {
                if (quns == 3 || quns == 4)
                {
                    return 1;
                }
            }

            return 0;
        }
        catch
        {
            return 0;
        }
    }
}
