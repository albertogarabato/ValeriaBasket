# ValeriBasquet · 0.3 — Compostela Courts

Baloncesto femenino arcade, 5 contra 5, en un pabellón 3D de Santiago. Valeria #7 juega con Nerea, Carla, Uxía y Alba en el Rosalía de Castro. Equipaciones y plantillas ficticias. Repositorio: albertogarabato/ValeriaBasket.

## Abrir

GitHub Pages: https://albertogarabato.github.io/ValeriaBasket/ (solo estará disponible si Pages está habilitado desde main / raíz).

En local: `python3 -m http.server 8080` y abrir http://localhost:8080. No necesita compilación. Requiere navegador moderno con WebGL 2 e Internet para Three.js 0.180.0 desde jsDelivr. Las fuentes de Google son opcionales. No abrir index.html con doble clic: los módulos necesitan HTTP.

## Qué cambia en 0.3

- Cámara TV que sigue la acción, cámara de ataque y vista táctica. Teclado y joystick se orientan respecto a la cámara.
- Posesiones continuas: las demás jugadoras conservan su posición tras canastas y robos. Saque de fondo y transición al otro aro, sin recolocar a todos los equipos tras cada tiro.
- Balón vivo tras un fallo, gravedad y botes. Rebotes disputados, recuperación manual saltando y cambio de control a quien recoge. Rebote ofensivo: al menos 14 segundos; cambio de equipo: 24.
- Entradas y mates asistidos: tiro normal a menos de 3,5 m; sprint + tiro a menos de 2,5 m y con energía para un mate.
- Tiro de un toque asistido, o mantener y soltar en verde para un lanzamiento preciso. El acierto depende de timing, distancia, presión y ritmo; no es una simulación física exacta del aro.
- Pases dirigidos con una dirección y E. Sin dirección, a la más cercana. Puedes preparar el tiro mientras llega el pase.
- Robos, tapones de cerca, salto por el rebote y cambio de mano con energía y protección breve del balón.
- IA con cortes sin balón, ayudas, pases a compañeras abiertas, ataque al aro y persecución del rebote.
- Modelos con codos y rodillas articulados; animaciones de carrera, bote, pase, tiro, entrada, mate y defensa. Parquet con veta, estela de balón y celebración de canastas.
- Sonidos procedurales de bote, aro, zapatillas y público, activables desde el botón de sonido. Sin muestras comerciales.
- Minimapa, indicador de energía, ritmo del equipo, feedback de tiro y estadísticas de rebotes, asistencias, robos, tapones, mates y tiros perfectos.

## Modos

**Partido:** tres minutos, prórroga de treinta segundos si empatas.

**A 21:** gana el primer equipo en alcanzar al menos 21 con dos puntos de ventaja. No hay reloj de partido; sí de posesión.

**Remontada:** empiezas perdiendo 8–14 y tienes noventa segundos para ganar. Un empate lleva a prórroga.

**Entrenamiento:** sin rivales ni reloj de partido. Reto de cinco canastas; al completarlo puedes seguir entrenando.

## Controles

| Acción | Teclado | Móvil |
| --- | --- | --- |
| Movimiento relativo a cámara | WASD o flechas | Joystick |
| Sprint | Shift | Mantener ROBO |
| Tiro rápido | Tocar Espacio | Tocar TIRAR |
| Tiro preciso | Mantener y soltar Espacio | Mantener y soltar TIRAR |
| Pase / cambiar defensora | E; dirección para apuntar pase | PASE + joystick |
| Robo / tapón / salto al rebote | F | ROBO / TAPÓN / REBOTE |
| Cambio de mano | C | FINTA |
| Pausa | P / Escape | Pausa |

Tu equipo ataca el aro del fondo desde la cámara de ataque; la rival ataca el contrario. La cámara TV muestra el partido de lado y sigue el balón. Cambia a táctica para ver toda la pista.

## Arquitectura

- `js/match.js`: estado puro, reglas, IA, tiempos, estadísticas y acciones.
- `js/scene.js`: Three.js, pabellón, modelos, animaciones, efectos y cámaras.
- `js/input.js`: entradas de teclado, joystick y botones simultáneos.
- `js/audio.js`: sonido generado con Web Audio.
- `js/teams.js`: clubes, nombres, dorsales y roles de las plantillas ficticias.
- `js/main.js`: menús, HUD, minimapa y coordinación.
- `css/game.css`: diseño adaptable.

No comparte partidas, cuentas ni Firebase con ARI CRAFT. Se mantiene el enfoque de módulos JavaScript + Three.js + GitHub Pages. Récord y victorias se guardan localmente en este navegador; no hay cuenta ni sincronización.

## Validación y límites

`node --test tests/*.test.js`: 18 pruebas cubren posesiones continuas, rebotes ofensivos y defensivos, dirección de pases, tiro preparado durante el pase, entradas/mates, tapones, robos sin teletransporte, cambios de mano, asistencias, modos y una simulación completa.

Revisado en navegador: movimiento, pase, tiro, mate con canasta y progreso del reto; diseño a 390 px y controles táctiles con ratón. Sin errores del motor en las comprobaciones. No se ha probado en teléfono físico; su rendimiento depende del dispositivo.

Arcade de primera versión, sin faltas, fueras de banda, cambios de quinteto, liga, multijugador ni reglamento completo. Los rebotes tienen gravedad simplificada; los tiros deciden el acierto según probabilidad. En entrenamiento, tras encestar se repone la posición inicial; en partido las otras jugadoras permanecen en su sitio y regresan corriendo.

## Fuentes y créditos

Clubes reales, plantillas femeninas ficticias: no se afirma que todos mantengan una sección femenina actual ni se representan sus plantillas o categorías reales. No hay escudos oficiales, licencias ni afiliación.

- Rosalía / FEDESA: https://baloncesto-fedesa.blogspot.com/2019/03/rosalia-fedesa-y-ulla-oil-siguen-con-su.html
- Censo de clubes de Santiago: https://fegaba.com/es/censos-provisionales-fegaba-2026/
- Three.js: licencia MIT en `vendor/THREE-LICENSE.txt`. La copia descargable incluye también una copia de respaldo del motor; la versión alojada lo carga desde el CDN.
