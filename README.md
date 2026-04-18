# Kronometa

Kronometa es una aplicacion web para cronometrar manualmente carreras sencillas
desde el navegador.

Esta pensada para pruebas en las que una persona registra salidas y llegadas en
meta, sin equipamiento adicional y sin servidor propio.

## Funcionalidades

- Salida masiva para todos los corredores.
- Salidas individuales o escalonadas.
- Registro manual de llegadas.
- Deshacer la ultima accion de cronometraje.
- Edicion manual de tiempos finalizados.
- Clasificacion automatica por mejor tiempo.
- Historico local de carreras.
- Exportacion del historico a CSV.

## Requisitos

- Node.js 22 o superior.
- npm 10 o superior.

## Instalacion

```bash
npm install
```

## Desarrollo

Arrancar el servidor local:

```bash
npm run dev
```

Vite mostrara una URL local, normalmente:

```text
http://localhost:5173/
```

## Comandos

Validar TypeScript:

```bash
npm run typecheck
```

Compilar la aplicacion:

```bash
npm run build
```

Previsualizar la build:

```bash
npm run preview
```

Ejecutar pruebas de integracion en Firefox:

```bash
npx playwright install firefox
npm run test:integration
```

Ejecutar todos los navegadores configurados:

```bash
npm run test:integration:all
```

## Uso basico

1. Elegir el tipo de salida: masiva o escalonada.
2. Anadir corredores con dorsal y nombre.
3. Preparar la carrera.
4. Iniciar la salida o dar salida al siguiente corredor.
5. Marcar cada llegada.
6. Revisar la clasificacion.
7. Repetir la carrera, empezar una nueva o exportar el historico.

## Datos

Kronometa guarda la sesion y el historico en `localStorage`.

Los datos permanecen en el navegador donde se usa la app. Si se borra el
almacenamiento del navegador, tambien se borra el historico local.

## Tecnologias

- TypeScript
- Vite
- PickComponents
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
