# Mis Tareas

Aplicación móvil de gestión de tareas con persistencia local en SQLite y generación de reportes en PDF.

## Descripción

Una aplicación de tipo to-do list que permite crear, editar, completar y eliminar tareas, organizarlas por prioridad y categoría, asignarles fecha límite, y generar un reporte exportable en PDF con el estado general de las tareas.

## Tecnologías utilizadas

- React Native
- Expo (Expo Router)
- TypeScript
- SQLite (expo-sqlite)
- expo-print / expo-sharing (generación y exportación de reportes PDF)
- expo-file-system

## Funcionalidades

- CRUD completo de tareas (crear, leer, actualizar, eliminar)
- Persistencia de datos en base de datos SQLite local
- Prioridad de tareas (alta, media, baja)
- Categorías de tareas (trabajo, estudio, personal, hogar)
- Fecha límite por tarea, con aviso visual de tareas vencidas
- Reprogramación rápida de tareas vencidas
- Ordenamiento automático: tareas vencidas primero, luego por prioridad, luego por fecha límite; tareas completadas al final
- Filtro de tareas por categoría
- Contador y barra de progreso de tareas completadas
- Pantalla de reportes con estadísticas (totales, por prioridad, por categoría)
- Generación y exportación de reporte en PDF

## Estructura del proyecto

    mi-primera-app/
    |-- app/
    |   |-- (tabs)/
    |   |   |-- index.tsx        (Pantalla principal, lista de tareas)
    |   |   |-- explore.tsx      (Pantalla de reportes y estadisticas)
    |   |   |-- _layout.tsx      (Configuracion de las pestanas)
    |   |-- _layout.tsx           (Layout raiz de la aplicacion)
    |-- db.ts                     (Logica de acceso a la base de datos SQLite)
    |-- pdf.ts                    (Generacion del reporte en PDF)
    |-- components/               (Componentes reutilizables)

## Instalacion y ejecucion

1. Instalar dependencias:

   npm install

2. Iniciar el proyecto:

   npx expo start

3. Escanear el codigo QR con la aplicacion Expo Go (Android/iOS), o presionar la tecla "a" para abrir en un emulador de Android.

## Requisitos previos

- Node.js instalado
- Aplicacion Expo Go instalada en el celular (o un emulador de Android/iOS configurado)
