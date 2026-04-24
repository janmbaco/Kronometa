# Kronometa

Kronometa es una aplicación web para cronometrar manualmente carreras sencillas desde el navegador.

Está pensada para pruebas en las que una persona registra salidas y llegadas en meta, sin equipamiento adicional y sin servidor propio.

## Interfaz y arquitectura

La interfaz está construida con [PickComponents](https://github.com/janmbaco/PickComponents), usado aquí como framework de componentes web. Kronometa no organiza la pantalla como una página con enlaces libres, sino como una máquina de estados de carrera: elegir modo, cargar corredores, preparar salida, cronometrar y revisar resultados.

El componente raíz `kronometa-app` mantiene el shell visual, el estado global visible y el router. Cada pantalla del flujo (`setup-mode-view`, `runner-setup-view`, `race-view`, `results-view`) se hidrata desde `RaceService` mediante lifecycles de PickComponents. Los componentes pequeños (`runner-form`, `runner-row`, `race-controls`, `results-panel`) no deciden la fase de la carrera: emiten intenciones de usuario y el servicio aplica las reglas del dominio.

La navegación superior es un breadcrumb de estado que va revelando fases a medida que la carrera avanza. Solo permite volver a fases anteriores cuando la máquina lo permite; durante el cronometraje queda como lectura pasiva para evitar saltos accidentales.

Más detalle:

- [Arquitectura de interfaz](docs/interface-architecture.md)

## Funcionalidades

- Salida masiva para todos los corredores.
- Salidas individuales o escalonadas.
- Registro manual de llegadas.
- Deshacer la última acción de cronometraje.
- Edición manual de tiempos finalizados.
- Clasificación automática por mejor tiempo.
- Histórico local de carreras.
- Exportación del histórico a CSV.

## Requisitos

- Node.js 22 o superior.
- npm 10 o superior.

## Instalación

```bash
npm install
```

## Desarrollo

Arrancar el servidor local:

```bash
npm run dev
```

Vite mostrará una URL local, normalmente:

```text
http://localhost:5173/
```

## Comandos

Validar TypeScript:

```bash
npm run typecheck
```

Compilar la aplicación:

```bash
npm run build
```

Previsualizar la build:

```bash
npm run preview
```

Ejecutar pruebas de integración en Firefox:

```bash
npx playwright install firefox
npm run test:integration
```

Ejecutar todos los navegadores configurados:

```bash
npm run test:integration:all
```

## Uso básico

1. Elegir el tipo de salida: masiva o escalonada.
2. Añadir corredores con dorsal y nombre.
3. Preparar la carrera.
4. Iniciar la salida o dar salida al siguiente corredor.
5. Marcar cada llegada.
6. Revisar la clasificación.
7. Repetir la carrera, empezar una nueva o exportar el histórico.

## Datos

Kronometa guarda la sesión y el histórico en `localStorage`.

Los datos permanecen en el navegador donde se usa la app. Si se borra el almacenamiento del navegador, también se borra el histórico local.

## Tecnologías

- TypeScript
- Vite
- [PickComponents](https://github.com/janmbaco/PickComponents), como framework de componentes web
- InjectKit
- Playwright

## Estructura

```text
src/
  app/
  features/
    race/
    race-shell/
    setup-mode/
    runner-setup/
    runner-registration/
    race-view/
    runner-timing/
    results/
    results-view/
  styles.css
  main.ts
```
