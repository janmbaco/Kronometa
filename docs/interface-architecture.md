# Arquitectura de interfaz

Fecha: 2026-04-24

Kronometa está diseñada como una herramienta de operación, no como una página informativa. La interfaz prioriza que una persona pueda registrar una carrera sin perderse, sin saltar pasos por error y sin depender de servidor.

## Base técnica

La UI usa [PickComponents](https://github.com/janmbaco/PickComponents) como framework de componentes web. En Kronometa se aprovechan cuatro piezas del framework:

- `@PickRender` para declarar componentes con template, estilos aislados y lifecycle.
- `@Reactive` para exponer estado renderizable sin stores externos.
- `PickLifecycleManager` para conectar componentes con servicios de dominio y limpiar suscripciones al desmontar.
- Primitivas declarativas (`pick-action`, `pick-for`, `pick-select`, `pick-router`) para acciones, listas, ramas condicionales y rutas.

La aplicación usa componentes web con Shadow DOM. Los estilos de cada feature viven junto a su template y heredan tokens globales definidos en `src/styles.css`.

## Principio de diseño

La pantalla no debe sugerir libertad donde el dominio no la tiene. El usuario puede operar la carrera, pero no debe poder convertir una carrera en curso en una pantalla anterior por accidente.

Por eso la UI separa tres tipos de acción:

- Acciones de flujo: continuar, preparar salida, iniciar carrera, repetir.
- Acciones de cronometraje: dar salida, llegada, editar tiempo, deshacer.
- Acciones de datos: exportar histórico, crear nueva carrera, borrar datos locales.

La fase visible se muestra como breadcrumb progresivo: primero aparece solo el modo de salida, después se añade el registro de corredores, luego la carrera y finalmente resultados. Solo los pasos anteriores válidos son clicables. Durante `running_mass` y `running_staggered`, el breadcrumb es solo lectura.

## Shell y rutas

`kronometa-app` es el shell principal:

- renderiza cabecera, estado actual y breadcrumb;
- monta `pick-router`;
- sincroniza URL y fase mediante `KronometaAppLifecycle`;
- expone intenciones de navegación hacia atrás.

Las rutas son una proyección de la máquina de estados:

- `/setup/mode` -> `select_mode`
- `/setup/runners` -> `register_runners`
- `/race` -> `ready_to_start`, `running_mass`, `running_staggered`
- `/results` -> `finished`

Si la URL no encaja con la fase real, el lifecycle devuelve al usuario a la
ruta canónica. Esto evita que la barra del navegador rompa la carrera.

## Componentes de pantalla

`setup-mode-view`

- Permite elegir salida masiva o escalonada.
- Emite la intención de continuar.
- No guarda directamente; delega en `RaceService`.

`runner-setup-view`

- Agrupa alta de corredores y listado editable.
- Permite volver a modo antes de preparar salida.
- Solo muestra eliminación cuando un corredor sigue pendiente y sin tiempos.

`race-view`

- Presenta la operación de carrera.
- En salida masiva, el control principal inicia a todos los corredores.
- En salida escalonada, divide la vista en siguiente salida, pendientes, en carrera y finalizados.
- Solo el siguiente corredor pendiente puede recibir salida.

`results-view`

- Muestra clasificación de la carrera cerrada.
- Muestra histórico persistido y exportación CSV.
- Aloja la acción destructiva “Borrar datos locales”, porque ese bloque es el lugar donde el usuario entiende que está gestionando persistencia.

## Componentes de dominio visual

`race-controls`

- Resume modo, reloj y contadores.
- Aloja acciones globales de la carrera: iniciar, deshacer, exportar y nueva
  sesión.

`runner-form`

- Normaliza la entrada de dorsal y nombre desde la UI.
- Presenta feedback local de alta.

`runner-row`

- Representa un corredor como unidad operativa.
- Sus acciones dependen del estado del corredor: salida, llegada, editar tiempo o eliminar.
- La edición manual de tiempo aparece solo cuando el corredor está finalizado.

`results-panel`

- Renderiza resultados ordenados.
- Usa tabla nativa para escritorio y adaptación visual a cards en móvil.

`history-entry`

- Resume una carrera finalizada del histórico.
- Mantiene la clasificacion historica separada de la sesion actual.

## Servicios

`RaceService`

- Es la autoridad de dominio.
- Aplica transiciones, valida acciones y persiste estado.
- Notifica snapshots inmutables a las vistas.

`StorageService`

- Carga, normaliza y migra estado desde `localStorage`.
- Persiste `config`, `session`, `history` y `lastFinishedSession`.
- Borra las claves locales de Kronometa cuando se solicita reset total.

`ClockService`

- Centraliza el tiempo actual para relojes y calculo de duraciones.

`ExportService`

- Convierte el historico a CSV.
- Descarga el fichero sin servidor.

`KronometaRoutingService`

- Encapsula navegacion.
- Usa el servicio de navegacion de PickComponents, adaptado al `base` de Vite
  para GitHub Pages.

## Persistencia y reset

Kronometa guarda datos en `localStorage`, bajo claves propias. Hay dos niveles
de reinicio:

- "Nueva sesion" conserva el historico y prepara una carrera limpia.
- "Borrar datos locales" elimina la carrera actual y el historico guardado en
  este navegador.

El reset total se coloca en la seccion de Historico para no mezclar una accion
destructiva de datos con los controles de cronometraje en carrera.

## Contratos importantes

- Las vistas no cambian fases directamente.
- La URL refleja la fase, no la decide.
- Las acciones destructivas piden confirmacion nativa.
- El breadcrumb nunca permite avanzar artificialmente.
- Las rutas de GitHub Pages usan `/Kronometa/` solo en build de produccion.
