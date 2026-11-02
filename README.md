# Rosco Bíblico (modo presencial)

Juego de rosco para jugar en una sola pantalla con amigos o familia, de 2 a 8 jugadores.
No hay que escribir respuestas: el jugador responde en voz alta y quien maneja la pantalla marca **Acertó**, **Falló** o **Pasapalabra**.

Hay dos formas de jugar (se elige al empezar):

- **Con anfitrión (recomendada):** una persona sostiene la pantalla, lee la pista en voz alta y ve la respuesta correcta al instante. Los jugadores no miran la pantalla. El reloj del jugador corre hasta que el anfitrión marca.
- **Pantalla compartida:** todos ven la pista, por ejemplo en una tele. La respuesta aparece cuando alguien toca **Ver respuesta**, y el reloj se detiene mientras tanto.

- 636 preguntas (personajes, lugares, libros y otros temas), 23 letras, 3 niveles de dificultad.
- Cada jugador tiene su propio rosco y su propio reloj. Juega su rosco completo de corrido (las letras pasadas vuelven en la segunda vuelta) y el turno pasa al siguiente cuando termina o se le acaba el tiempo.
- Antes de cada turno aparece un botón **Comenzar**, para que el jugador esté listo antes de que corra el reloj.
- Las preguntas que ya salieron se evitan en las partidas siguientes, hasta agotarse.
- No usa servidores ni base de datos: es un sitio estático. Nada se envía a ningún lado.

## Probarlo en tu computadora

Abrí `index.html` con doble clic. Funciona sin instalar nada (las tipografías se descargan solas si hay internet; si no, usa unas parecidas).

## Instalarlo en Vercel con un subdominio

1. **Subí la carpeta a GitHub.** Creá un repositorio nuevo (por ejemplo `rosco-biblico`) y subí todo el contenido de esta carpeta tal cual.
2. **Importalo en Vercel.** En vercel.com: *Add New → Project → Import* y elegí el repositorio. En *Framework Preset* dejá **Other**. No hace falta comando de build ni carpeta de salida (dejá los campos vacíos). *Deploy*.
3. **Agregá el subdominio.** En el proyecto: *Settings → Domains → Add* y escribí, por ejemplo, `rosco.tudominio.com`.
4. **Creá el registro DNS.** Donde administrás el DNS de tu dominio (en cPanel: *Zone Editor*), agregá un registro **CNAME**:
   - Nombre: `rosco`
   - Destino: `cname.vercel-dns.com` (Vercel te muestra el valor exacto en la pantalla del dominio; usá el que te indique).
5. Esperá unos minutos hasta que Vercel marque el dominio como válido. El certificado HTTPS se crea solo.

Cada vez que cambies un archivo y lo subas a GitHub, Vercel actualiza el sitio automáticamente.

### Alternativa más simple: directo en tu cPanel

Como es un sitio estático, también podés crear el subdominio en cPanel (*Dominios → Crear subdominio*) y subir el contenido de esta carpeta a su directorio con el Administrador de archivos. Queda funcionando igual.

## Cómo se juega

| Acción | Botón | Atajo |
| --- | --- | --- |
| Ver la respuesta (solo pantalla compartida) | Ver respuesta | Espacio |
| Pasar la letra | Pasapalabra | P |
| Marcar acierto | Acertó | A |
| Marcar fallo | Falló | F |
| Pausa | Pausa | Esc |

Consejo para la tele: usá **Pantalla completa** y conectá la notebook o la tablet por HDMI o con la función de transmitir pantalla.

## Agregar o corregir preguntas

Las preguntas están en la carpeta `preguntas/`. Cada fila tiene este formato:

```js
['p', 2, 'Moisés', 'Salvado de las aguas del Nilo siendo bebé, guió a Israel fuera de Egipto.', 'Respuestas alternativas (opcional)'],
```

- Primer valor: tipo (`'p'` personaje, `'l'` lugar, `'o'` libro u otro tema).
- Segundo valor: dificultad (1 fácil, 2 media, 3 difícil).
- Tercer valor: la respuesta. Debe contener la letra de su sección.
- Cuarto valor: la pista. No debe nombrar la respuesta.
- Quinto valor (opcional): otras formas válidas, solo para mostrarlas en pantalla.

Para agregar tus propias preguntas sin tocar las demás, copiá una fila dentro de `preguntas/extras.js`, en la letra que corresponda.

Cuando la respuesta no empieza con la letra (como en la X), el juego muestra automáticamente "Contiene la X".

## Base: Traducción del Nuevo Mundo

Los nombres y términos siguen la Traducción del Nuevo Mundo (edición de estudio en wol.jw.org): Abrahán, Boaz, Pérez, Jesé, Ageo, Elí, Hofní, Peniná, Elcaná, Jokébed, Hamán, "madero de tormento", "congregación", "espíritu santo", Har–Magedón, etc. Las pistas son paráfrasis propias, no texto de la Biblia.

Se comprobaron en wol.jw.org: Génesis 5, Éxodo 6, Jueces 4, 1 Samuel 1, 1 Reyes 16, Ester 1, Juan 19, Romanos 16, Ageo 1 y Josué 8, entre otros.

**Sin comprobar todavía** (conviene que los revises vos): Betzata, Siloam, Jetró, Moria, Bet-sémes, Cleofás/Clopas, Hamán, Asá, Guerizim y las pistas históricas o de cifras. Si alguna no coincide, se corrige en `preguntas/` (o en `preguntas/tnm.js`, que suma entradas adaptadas).

## Si más adelante querés ranking o historial entre dispositivos

Este modo no lo necesita, pero se puede sumar Firebase (Firestore) para guardar puntajes y nombres. Hoy no está incluido para mantener el juego simple y sin dependencias.