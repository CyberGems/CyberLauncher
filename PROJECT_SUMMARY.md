# Cyber Launcher - Project Summary

## Descripción General
**Cyber Launcher** es un lanzador de aplicaciones (App Launcher) y entorno de espacio de trabajo virtual basado en tecnologías web, diseñado con una temática inmersiva al estilo Cyberpunk y Sci-Fi. La aplicación simula ser un "Sistema Operativo Neural" interconectado, el cual permite a los usuarios consolidar accesos directos a sus aplicaciones favoritas, personalizar su entorno y gestionar herramientas de uso cotidiano.

## Tecnologías Principales
* **Framework:** React 19 impulsado por Vite.
* **Estilizado:** Tailwind CSS v4 para diseño fluido y personalización basada en clases utilitarias.
* **Animaciones:** `motion` (Framer Motion) para las transiciones, físicas de drag-and-drop, modales fluidos y feedback visual interactivo.
* **Íconos:** `lucide-react` utilizado uniformemente a lo largo de la interfaz.
* **Gestión de Estado y Almacenamiento:** Control avanzado de estado de componentes, integrándose fuertemente de manera asincrónica con la API de `localStorage` para mantener la persistencia temporal de los datos en el navegador.

## Características Clave del Proyecto
1. **Gestión Completa de Aplicaciones:**
   * Organización mediante cuadrícula (grid) fluida o formato de lista lineal.
   * Modales dinámicos para agregar, editar (cambiar rutas de iconos, nombre, ruta de activación) y borrar accesos directos.
2. **Interactividad Avanzada (Drag-and-Drop):**
   * Sistema de "agarrar y soltar" totalmente orgánico para colocar aplicaciones en lugares estratégicos, como la barra de tareas central y la sección de "Favoritos".
   * Sistema de Menú Contextual personalizado (Clic derecho sobre apps) para accesos rápidos.
3. **Telemetría Virtual y Sistema de Uso:**
   * Un contador global unificado en la interfaz que registra las métricas ("LANZAMIENTOS") de cuántas veces se usa un recurso visualmente.
   * Sistema de ranking que calcula dinámicamente el *Top* de las aplicaciones "Más Usadas".
4. **Motor de Personalización de Tema (Glassmorphism):**
   * Selector dinámico integrado de fondos de pantalla que permite elegir entre Imágenes (variedad de sets predefinidos y opción de URL personalizada), colores sólidos espaciales, y gradientes futuristas.
   * Efecto de cristal personalizable mediante barras de control deslizantes para cambiar en tiempo real la "Opacidad del Fondo" y la "Intensidad del Cristal" (Blur).
5. **Sistema de Copia de Seguridad:**
   * Funcionalidad explícita para Exportar el entorno visual completo (incluyendo el historial de uso y todas las apps agregadas) y para Importarlo posteriormente a través de un archivo `.json`.

## Arquitectura Front-end
El proyecto adopta un enfoque monolítico reactivo predominantemente ubicado en `src/App.tsx`. 
Posee delegación de eventos a la ventana del navegador (`window`), maneja una carga inteligente de listas y sub-paneles izquierdo y derecho (sidebars ajustables en ancho), y presenta un renderizado responsivo muy cuidado para mantener un aspecto unificado de "Terminal Sci-Fi" y "Dashboard Tecnológico" en cualquier tamaño de pantalla de interacción.
