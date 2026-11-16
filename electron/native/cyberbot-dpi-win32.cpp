#include <windows.h>
#include <commctrl.h>
#include <node_api.h>
#include <cstring>
#include <new>

struct DpiMove {
  RECT bounds;
  UINT dpi;
  ULONGLONG deadline;
};

static LRESULT CALLBACK OnWindowMessage(HWND window, UINT message, WPARAM wp, LPARAM lp, UINT_PTR id, DWORD_PTR data) {
  auto* target = reinterpret_cast<DpiMove*>(data);
  // Only the DPI messages caused by the requested move use these bounds.
  const bool changing = target->dpi && GetTickCount64() <= target->deadline;
  if (message == WM_GETDPISCALEDSIZE && changing && wp == target->dpi && lp) {
    auto* size = reinterpret_cast<SIZE*>(lp);
    size->cx = target->bounds.right - target->bounds.left;
    size->cy = target->bounds.bottom - target->bounds.top;
    return TRUE;
  }
  if (message == WM_DPICHANGED && changing && LOWORD(wp) == target->dpi && lp) {
    *reinterpret_cast<RECT*>(lp) = target->bounds;
    target->dpi = 0;
  }
  if (message == WM_NCDESTROY) {
    RemoveWindowSubclass(window, OnWindowMessage, id);
    delete target;
  }
  return DefSubclassProc(window, message, wp, lp);
}

static napi_value Move(napi_env env, napi_callback_info info) {
  size_t count = 6;
  napi_value args[6], result;
  void* native = nullptr;
  size_t bytes = 0;
  int32_t x, y, width, height, dpi;
  HWND window;
  if (napi_get_cb_info(env, info, &count, args, nullptr, nullptr) != napi_ok || count != 6 ||
      napi_get_buffer_info(env, args[0], &native, &bytes) != napi_ok || bytes != sizeof(HWND) ||
      napi_get_value_int32(env, args[1], &x) != napi_ok || napi_get_value_int32(env, args[2], &y) != napi_ok ||
      napi_get_value_int32(env, args[3], &width) != napi_ok || napi_get_value_int32(env, args[4], &height) != napi_ok ||
      napi_get_value_int32(env, args[5], &dpi) != napi_ok || width <= 0 || height <= 0 || dpi <= 0) {
    napi_throw_type_error(env, nullptr, "Expected an HWND, physical bounds and target DPI");
    return nullptr;
  }

  std::memcpy(&window, native, sizeof(window));
  if (GetWindowThreadProcessId(window, nullptr) != GetCurrentThreadId()) {
    napi_get_boolean(env, false, &result);
    return result;
  }

  constexpr UINT_PTR id = 1;
  DWORD_PTR saved;
  DpiMove* target;
  if (GetWindowSubclass(window, OnWindowMessage, id, &saved)) {
    target = reinterpret_cast<DpiMove*>(saved);
  } else {
    target = new (std::nothrow) DpiMove{};
    if (!target || !SetWindowSubclass(window, OnWindowMessage, id, reinterpret_cast<DWORD_PTR>(target))) {
      delete target;
      napi_get_boolean(env, false, &result);
      return result;
    }
  }

  target->bounds = { x, y, x + width, y + height };
  target->dpi = GetDpiForWindow(window) == static_cast<UINT>(dpi) ? 0 : static_cast<UINT>(dpi);
  target->deadline = GetTickCount64() + 500;
  const bool moved = SetWindowPos(window, nullptr, x, y, width, height,
    SWP_NOZORDER | SWP_NOACTIVATE | SWP_NOOWNERZORDER | SWP_NOSENDCHANGING) != FALSE;
  if (!moved && GetWindowSubclass(window, OnWindowMessage, id, &saved)) {
    reinterpret_cast<DpiMove*>(saved)->dpi = 0;
  }
  napi_get_boolean(env, moved, &result);
  return result;
}

NAPI_MODULE_INIT() {
  napi_value move;
  napi_create_function(env, "move", NAPI_AUTO_LENGTH, Move, nullptr, &move);
  napi_set_named_property(env, exports, "move", move);
  return exports;
}
