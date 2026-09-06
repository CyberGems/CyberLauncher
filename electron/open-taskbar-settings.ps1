# PowerShell script to open Windows Taskbar Settings and automatically navigate
# to the nested "Select which icons appear on the taskbar" page on Windows 10.
# Matches the battle-tested behavior of CyberPaste.

param(
    [int]$TimeoutSeconds = 12
)

$ErrorActionPreference = 'SilentlyContinue'

# Launch the taskbar settings URI
Start-Process "ms-settings:taskbar"

Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes -ErrorAction SilentlyContinue

$cs = @'
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public static class NativeWin {
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern IntPtr FindWindowEx(IntPtr parent, IntPtr childAfter, string className, string windowTitle);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static List<IntPtr> GetAppFrames() {
        var list = new List<IntPtr>();
        IntPtr cur = IntPtr.Zero;
        while (true) {
            cur = FindWindowEx(IntPtr.Zero, cur, "ApplicationFrameWindow", null);
            if (cur == IntPtr.Zero) break;
            list.Add(cur);
        }
        return list;
    }

    public static IntPtr GetCoreWindow(IntPtr appFrame) {
        return FindWindowEx(appFrame, IntPtr.Zero, "Windows.UI.Core.CoreWindow", null);
    }
}
'@

Add-Type -TypeDefinition $cs -ErrorAction SilentlyContinue

$linkFragments = @(
    "icons appear on the taskbar",
    "iconos que aparecen",
    "iconos que aparecer",
    "seleccionar qué iconos",
    "seleccionar que iconos",
    "seleccionar los iconos",
    "elegir qué iconos",
    "elegir que iconos",
    "symbole in der taskleiste",
    "icônes qui s'affichent",
    "icones qui s'affichent",
    "选择哪些图标",
    "選擇哪些圖示"
)

$alreadyOnPageFragments = @(
    "always show all icons",
    "mostrar siempre todos los iconos",
    "alle symbole im infobereich",
    "toujours afficher toutes",
    "始终在通知区域",
    "始終在通知區域"
)

$condLinks = New-Object System.Windows.Automation.OrCondition(
    (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Hyperlink)),
    (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button))
)

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$done = $false

while ((Get-Date) -lt $deadline -and -not $done) {
    # 1. Enumerate all ApplicationFrameWindows
    $frames = [NativeWin]::GetAppFrames()
    
    foreach ($hwnd in $frames) {
        # Check if CoreWindow exists
        $coreHwnd = [NativeWin]::GetCoreWindow($hwnd)
        $targetHandle = if ($coreHwnd -ne [IntPtr]::Zero) { $coreHwnd } else { $hwnd }
        
        $rootElement = $null
        try {
            $rootElement = [System.Windows.Automation.AutomationElement]::FromHandle($targetHandle)
        } catch {
            continue
        }
        
        if ($rootElement -eq $null) { continue }
        
        # Check if already on the nested page
        $allTextCond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Text)
        $textElements = $null
        try {
            $textElements = $rootElement.FindAll([System.Windows.Automation.TreeScope]::Descendants, $allTextCond)
        } catch {}
        
        if ($textElements -ne $null) {
            foreach ($t in $textElements) {
                $tName = $t.Current.Name.ToLowerInvariant()
                foreach ($f in $alreadyOnPageFragments) {
                    if ($tName.Contains($f)) {
                        [NativeWin]::SetForegroundWindow($hwnd)
                        $done = $true
                        break
                    }
                }
                if ($done) { break }
            }
        }
        
        if ($done) { break }
        
        # Search for the hyperlink to the nested page
        $elements = $null
        try {
            $elements = $rootElement.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condLinks)
        } catch {
            continue
        }
        
        if ($elements -ne $null) {
            foreach ($el in $elements) {
                $name = $el.Current.Name.ToLowerInvariant()
                if ([string]::IsNullOrWhiteSpace($name)) { continue }
                
                foreach ($frag in $linkFragments) {
                    if ($name.Contains($frag)) {
                        try {
                            $inv = $el.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
                            if ($inv -ne $null) {
                                $inv.Invoke()
                                [NativeWin]::SetForegroundWindow($hwnd)
                                $done = $true
                                break
                            }
                        } catch {}
                    }
                }
                if ($done) { break }
            }
        }
        
        if ($done) { break }
    }
    
    if (-not $done) {
        Start-Sleep -Milliseconds 250
    }
}
