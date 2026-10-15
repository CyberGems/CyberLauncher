# Retomar CyberBot / Resume CyberBot

## Español

Abre una sesión nueva en el proyecto CyberLauncher. El contexto duradero está en este repositorio: esta guía, [el historial de diseño y verificación](cyberbot-design-review.md), los tests y la implementación compartida. No dependas de que otra sesión recuerde la conversación o conserve los procesos y perfiles temporales.

Puedes iniciar el trabajo con este mensaje:

> Retoma CyberBot siguiendo docs/cyberbot-workflow.md y docs/cyberbot-design-review.md. Usa la revisión Electron con perfil aislado y los componentes reales del launcher y del bot flotante. Conserva el diseño aprobado y comprueba los cambios dentro de la app. Quiero ajustar: [detalle].

Desde la raíz del proyecto:

~~~powershell
npm run build
npm run cyberbot:review
~~~

La ventana ejecuta la App real. Selecciona **Comportamiento real** para probar interacciones; la inspección fija expresiones y suspende parte de los comportamientos automáticos. **Ocultar controles** permite revisar el resultado sin el panel de inspección.

Para automatización y diagnóstico local:

~~~powershell
npm run cyberbot:review:inspect
npm run test:cyberbot
npm run lint
~~~

La variante inspect abre CDP en 127.0.0.1:9445 y Vite en 127.0.0.1:4321. Antes de reutilizar una instancia, comprueba que pertenece a esta revisión. Antes de modificar datos en pruebas, confirma que getConfigPath apunta al perfil temporal CyberLauncher-CyberBot-review-* y a su subcarpeta data. La revisión copia apariencia, organización e iconos; excluye tareas programadas y desactiva actualizaciones, respaldos y alertas automáticas. No cambies el perfil instalado para hacer pruebas.

Cierra la instancia por su menú de bandeja **Salir** o con Ctrl+C en su terminal. El botón de cerrar la ventana solo la oculta. Si un puerto está ocupado, identifica su propietario: no cierres indiscriminadamente procesos Electron ni borres perfiles.

La referencia actual es src/components/companion/, especialmente approved/ApprovedCyberBotAvatar.tsx, cyberbot-approved.svg y las capas de integración. El launcher y las notificaciones flotantes usan el mismo avatar. El HTML original en artifacts/ es una referencia privada histórica, no una dependencia del build. No lo modifiques ni ejecutes una nueva extracción para ajustes normales: podría reemplazar avances posteriores. AGENTS.md y artifacts/ deben permanecer privados e intactos.

Verifica el flujo afectado en la App real, ambos idiomas cuando cambien textos, movimiento reducido y las prioridades de avisos relevantes. Usa tests para el comportamiento y mediciones/capturas para la apariencia. Documenta lo comprobado y lo pendiente; una captura estática no demuestra que una animación funciona.

## English

Start a new session in the CyberLauncher project and reference this guide plus [the design and verification history](cyberbot-design-review.md). Repository code, documentation and tests provide continuity; temporary sessions, processes and profiles do not.

Run npm run build followed by npm run cyberbot:review. Select Real behavior for production interactions; inspection holds expressions and suspends automatic behavior. Use npm run cyberbot:review:inspect for local automation through CDP (127.0.0.1:9445), with Vite on 127.0.0.1:4321. Check instance ownership and verify getConfigPath belongs to CyberLauncher-CyberBot-review-*/data before changing test data. Never use the installed profile for interaction tests.

Exit through the review tray menu or Ctrl+C in its terminal. Window close only hides it. Identify occupied ports rather than terminating unrelated Electron processes or deleting profiles.

Production and floating notifications share the approved component under src/components/companion/. The original artifacts/ HTML remains a private historical reference and is not a build dependency. Do not re-extract it for ordinary changes or alter private control files. Verify affected real-App flows, bilingual text and reduced motion; record concrete results and remaining limitations.
