# ValeriBasquet · 0.2

Juego nuevo de baloncesto 3D para navegador y móvil, ambientado en un pabellón ficticio de Santiago de Compostela. Rosalía de Castro es el equipo inicial; Valeria lleva el dorsal 7. El repositorio se llama ValeriaBasket y la marca del juego es ValeriBasquet.

## Jugar

GitHub Pages: https://albertogarabato.github.io/ValeriaBasket/ (requiere habilitar Pages desde main / raíz).

Para abrir en local, ejecuta `python3 -m http.server 8080` en esta carpeta y visita http://localhost:8080. Los módulos del navegador requieren HTTP: no abras index.html con doble clic. No necesita compilación ni instalación de paquetes. Motor Three.js 0.180.0 desde jsDelivr, licencia MIT; requiere conexión a Internet. Una copia de respaldo del motor se incluye en vendor en el ZIP descargable; las fuentes de Google son opcionales y tienen alternativa local. Requiere WebGL 2 y navegador moderno.

## Primera versión

- Pista completa 5 contra 5, seis clubes, tres dificultades y entreno libre.
- Jugadoras de geometría curva con extremidades animadas, sombra, nombre y dorsal.
- Pabellón, gradas, público, parquet, aro, tablero transparente y red en 3D.
- Movimiento, sprint con energía, pases, cambio de jugadora, robos, tiros de 2/3 puntos y barra de lanzamiento.
- Partidos de tres minutos, reloj de posesión de 24 segundos, prórroga de 30 segundos, marcador y estadísticas finales.
- Joystick táctil, botones simultáneos, dos cámaras, pausa al perder foco, sonido opcional y mejor puntuación local.

WASD o flechas: moverse. Espacio: mantener y soltar el tiro en verde. E: pase al compañera más cercano / cambiar defensora. F: intentar robo de cerca. Shift: correr. P o Escape: pausa. En móvil, joystick y botones; mantener ROBO también activa sprint. Se ataca siempre la canasta del fondo.

Arcade a pista completa: tras cada lanzamiento resuelto cambia la posesión. No hay rebotes disputados, faltas, multijugadora, plantillas reales ni simulación completa de reglamento. El acierto tiene componente aleatorio y depende de timing, distancia y presión. Entrenamiento sin rivales ni reloj de partido.

## Arquitectura

`js/match.js`: reglas puras, posesión, reloj, IA, tiro, pase y robo. `js/scene.js`: geometría, iluminación, animación y cámaras. `js/input.js`: teclado y controles táctiles. `js/teams.js`: clubes, equipaciones ficticias y jugadoraas personalizables. `js/main.js`: interfaz y coordinación. `css/game.css`: interfaz responsive. No comparte datos ni Firebase con ARI CRAFT. Reutiliza el enfoque técnico de Three.js + módulos JS + GitHub Pages; no reutiliza su mundo voxel.

Para añadir nombres, edita `players` en teams.js. Los cinco dorsales son 7, 12, 23, 9 y 15. Valeria es personalizada; no se atribuye pertenencia real al club. No se usan escudos oficiales ni licencias.

## Fuentes

Rosalía / FEDESA: https://baloncesto-fedesa.blogspot.com/2019/03/rosalia-fedesa-y-ulla-oil-siguen-con-su.html

Clubes de Santiago: https://fegaba.com/es/censos-provisionales-fegaba-2026/

Las plantillas femeninas son ficticias y no afirman que todos los clubes tengan una sección femenina actual. Los nombres identifican clubes locales, no sus plantillas ni categorías actuales. Equipaciones, personajes e identidad visual ficticios. Todos tienen capacidades equivalentes.

## Verificar

`node --test tests/*.test.js` con Node moderno. Pruebas de movimiento, tiro, puntuación, pases, robos, posesión, pausa, prórroga y final. La revisión visual y de entrada se hace en navegador. Rendimiento en dispositivos móviles físicos pendiente.

## Novedades 0.2

Baloncesto femenino: Valeria #7 con Nerea, Carla, Uxía y Alba en el Rosalía. Diez jugadoras en pista completa con dos canastas, roles de quinteto, IA de cinco posiciones, reloj de 24 segundos y modelos con rostro y pelo animado. Cada equipo ataca la canasta opuesta.
