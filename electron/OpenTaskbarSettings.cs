using System;
using System.Diagnostics;
using System.Threading;
using System.Windows.Automation;

internal static class Program
{
    private const string TaskbarSettingsUri = "ms-settings:taskbar";

    private static readonly string[] IconListLinkFragments =
    {
        "icons appear on the taskbar",
        "iconos que aparecer",
        "iconos que aparecen",
        "seleccionar qué iconos",
        "seleccionar que iconos",
        "seleccionar los iconos",
        "symbole in der taskleiste",
        "icônes qui s'affichent",
        "icones qui s'affichent",
        "选择哪些图标",
        "選擇哪些圖示"
    };

    private static readonly string[] IconListPageFragments =
    {
        "Always show all icons in the notification area",
        "Mostrar siempre todos los iconos",
        "alle symbole im infobereich",
        "toujours afficher toutes les icônes"
    };

    private static readonly string[] SettingsWindowTitles =
    {
        "Settings",
        "Configuración",
        "Einstellungen",
        "Paramètres"
    };

    [STAThread]
    public static void Main()
    {
        try
        {
            TryStartUri(TaskbarSettingsUri);
            TryOpenIconListPage();
        }
        catch
        {
            // Fail silently
        }
    }

    private static void TryOpenIconListPage()
    {
        try
        {
            var deadline = DateTime.UtcNow.AddSeconds(12);
            while (DateTime.UtcNow < deadline)
            {
                var window = FindSettingsWindow();
                if (window != null)
                {
                    if (HasNamedFragment(window, IconListPageFragments))
                        return;
                    if (TryInvokeIconListLink(window))
                        return;
                }

                Thread.Sleep(250);
            }
        }
        catch
        {
        }
    }

    private static AutomationElement FindSettingsWindow()
    {
        var root = AutomationElement.RootElement;
        foreach (var title in SettingsWindowTitles)
        {
            try
            {
                var window = root.FindFirst(
                    TreeScope.Children,
                    new PropertyCondition(AutomationElement.NameProperty, title));
                if (window != null)
                    return window;
            }
            catch
            {
            }
        }

        return null;
    }

    private static bool TryInvokeIconListLink(AutomationElement window)
    {
        try
        {
            var cond = new OrCondition(
                new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Hyperlink),
                new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Button)
            );

            var links = window.FindAll(TreeScope.Descendants, cond);

            foreach (AutomationElement link in links)
            {
                var name = link.Current.Name;
                if (string.IsNullOrWhiteSpace(name) || !ContainsAny(name, IconListLinkFragments))
                    continue;

                object pattern;
                if (link.TryGetCurrentPattern(InvokePattern.Pattern, out pattern))
                {
                    InvokePattern invoke = pattern as InvokePattern;
                    if (invoke != null)
                    {
                        invoke.Invoke();
                        return true;
                    }
                }
            }
        }
        catch
        {
        }

        return false;
    }

    private static bool HasNamedFragment(AutomationElement window, string[] fragments)
    {
        try
        {
            var nodes = window.FindAll(TreeScope.Descendants, Condition.TrueCondition);
            foreach (AutomationElement node in nodes)
            {
                var name = node.Current.Name;
                if (!string.IsNullOrWhiteSpace(name) && ContainsAny(name, fragments))
                    return true;
            }
        }
        catch
        {
        }

        return false;
    }

    private static bool ContainsAny(string text, string[] fragments)
    {
        foreach (var fragment in fragments)
        {
            if (text.IndexOf(fragment, StringComparison.OrdinalIgnoreCase) >= 0)
                return true;
        }

        return false;
    }

    private static bool TryStartUri(string uri)
    {
        try
        {
            Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true });
            return true;
        }
        catch
        {
            return false;
        }
    }
}
