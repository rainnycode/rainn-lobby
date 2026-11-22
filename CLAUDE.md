# rainn — Press kit v2 "El escondite" (contexto para Claude Code)

Este archivo resume todo lo hablado en el chat de claude.ai (proyecto "1080") hasta el 22 nov 2026.
Léelo completo antes de tocar nada.

## Quién es el cliente
- **Rubén** = el artista **rainn** (venezolano, vive en Panamá). Instagram @iluvrainnsomuch.
- **1080colorado** es su marca de ropa y su clan creativo (se llama "1080colorado", NO "1080 fashion archive").
- Escribe en español casual y corto ("dale", "duro", "q sigue"). Responde en español, directo, sin rollos.
- Le gusta ir **poco a poco**, aprobar cada paso, y que le muestres una vista previa antes de seguir.
- **Créditos de Higgsfield: dile el costo antes de gastar.** Ha rechazado generaciones lanzadas sin su OK.
- Contacto público del EPK: contactrainn@gmail.com · +507 6591-4498.

## Qué existe ya
| Cosa | Dónde |
| --- | --- |
| EPK v1 de rainn (web + PDF) | `epk-v1/` · artifact https://claude.ai/artifact/HJs65WPbLgjxP7jQMosDNC |
| Versión para Vercel en 1080colorado.com/rainn | `vercel/` (`vercel.json` + `public/`) |
| Fotos/portadas usadas en el EPK | `assets/` |
| **El escondite 3D (v3)** — la página principal del press kit v2 | `escondite/escondite.html` · `escondite/index.html` (para abrir en el navegador) · artifact https://claude.ai/artifact/1kLdGLDc1k4VEvzy62MjPp |
| Versión anterior del escondite (formas simples) | `escondite/escondite.v1.bak.html` |
| 9 modelos sueltos (vista previa de cada uno) | `escondite/modelos/*.html` (fragmento) y `escondite/modelos/ver/*.html` (para abrir) |
| Código fuente de cada modelo | `escondite/parts/*.js` |
| Capturas de referencia | `escondite/capturas/` |
| Script de prueba (Playwright + swiftshader) | `pruebas/` |

**Hosting:** el dominio 1080colorado.com está en Vercel conectado al repo de GitHub `salvame-kim` (del usuario `rainnycode`).
Ese repo también tiene el juego **SALVAME KIM!** — **NO tocar el juego.** El press kit vive en la ruta `/rainn`.
No conectes ni hagas push a repos sin que Rubén lo pida explícitamente.

Los archivos `escondite.html` y `modelos/*.html` son **fragmentos** (empiezan con `<title>`, sin `<html>/<body>`) porque así se publican como artifact. `index.html` y `modelos/ver/` son las mismas páginas envueltas en un documento completo para abrir local.

## El concepto (press kit v2, tras reunión con Squiz)
Página = **mundo 3D que se explora como un juego**: "el escondite de rainn".
- **El cursor es una mira roja.** Al pasar sobre un objeto lo "fija" y muestra nombre + qué abre.
- **Click en un objeto → la cámara hace zoom y se abre su sección** (panel lateral en PC, hoja inferior en celular). Botón volver + Esc.
- Tiene que ser **intuitivo**: intro corta, pistas, menú HUD siempre visible, minimapa, nunca más de 2 clicks, funciona en celular y PC.
- **Ambiente aprobado:** edificio abandonado en obra gris, de noche (basado en fotos de Rubén). Concreto crudo, columnas, tuberías rojas, cables, drywall, mezzanine de metal con baranda, charcos de agua con lluvia ("rainn"), mira roja pintada con spray en el piso. Casi todo negro, charcos de luz dura de lámparas de trabajo, tinte frío.
- **Gráficos:** videojuego **moderno** (no low-poly), pero **serio y oscuro**. NO colorido, NO caricaturesco/funny. "keep it serious, solo los graphics son los que vamos a improve".
- **Acabado glossy en todo** (clearcoat).
- Descartado: cueva de hielo, islas, granja, low-poly GameCube, estilo Switch colorido, look "minecraft".

### Objetos ↔ secciones
| Objeto | Sección | Estado |
| --- | --- | --- |
| Arcade | SALVAME KIM! (juego) | ✅ código |
| Rockola | Música (un título, un click) | ✅ código |
| TV + cámara en trípode, panel LED, claqueta | Videos + cómo se hacen + small team | ✅ código |
| Escenario de pallets, mic, monitores, DJ | Shows (con videos) | ✅ código |
| 5 monitores CRT en el mezzanine | Los números (máx. 5 líneas + screenshots) | ✅ código |
| Radio "108.0 MHz", libreta, sacos de arena | Contacto + links a perfiles | ✅ código |
| Bultos envueltos en plástico con etiquetas (NEPO, TEMA SIN ESTRENAR, BOLSO 1080) | Lo que viene / en proceso | ✅ código |
| Pared con mapa "PTY · SECTOR 1080", polaroids, hilo rojo | Moodboard | ✅ código |
| Tablero de expedientes MÚSICA / OTRAS COSAS (BASKIAT, PASH, SYS VINTAGE) | Colaboraciones | ✅ código (Rubén lo aprobó: "así está bien") |
| Repisa de figuras: rainn, Sebs (martillo/gorra), Kim Atenea (espíritu de agua), JD RED (piel roja, mono negro, llamas) | Bio + universo + personajes | ⏳ placeholder — falta 3D |
| Maniquí 1080 (ropa negra, pañuelo blanco) + perchero | 1080 | ⏳ placeholder — falta 3D |
| **rainn sentado orando, manos juntas** (NO clickeable) | — | ⏳ en curso (ver abajo) |

## Técnico del escondite
- Three.js **r128** desde cdnjs; postprocesado desde jsDelivr `three@0.128.0/examples/js` (CopyShader, LuminosityHighPassShader, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass).
- MeshStandard → MeshPhysical vía `glossify()` (clearcoat 1, roughness ×0.4; materiales mate ≥ .88 → clearcoat .35 / .3). ACES, sRGB, sombras PCFSoft (apagadas en táctil), entorno PMREM con paneles de luz, FogExp2, bloom, pase de grano/viñeta, conos de luz falsos aditivos, polvo (Points), lluvia (LineSegments).
- Texturas generadas en canvas (`canvasTex`, `rnd`, `px`, `Std`). Pantallas animadas en canvas.
- Patrón de modelos: `function make_X(){ ...; return {g: group, tick: fn}; }`; los ticks corren en el loop.
- `LAMP = 15`; sombras solo para juego, musica, shows, videos. En táctil: sin point lights, pixel ratio 1.
- `LAYOUT` (x,z[,y]) y `VIEW` (distancia/altura de cámara por objeto) están en `escondite.html`.
- Trampas conocidas de r128: `THREE.CapsuleGeometry` no existe; cuidado con z-fighting (usa offsets y `shadow.normalBias = .03`).
- Pendiente técnico: probar rendimiento real en celular (Rubén no ha confirmado); verificar el encuadre del zoom de cada objeto.

## rainn orando — estado (22 nov)
Intentos en Higgsfield (todo en su cuenta):
- Render aprobado temporalmente (estilo Smash, sentado en caja, outfit real): job `3a623218-d30f-4d11-826c-466376aea7ed`.
- 3D con Tripo de ese render: job `a9821c70-62fc-4977-aed6-d49054e3d82d` (GLB). Rubén: "está cool pero jorobado y el gorrito muy puntiagudo".
- Character sheets y retratos estilizados: **"who is bro / no se parece"** — los modelos de imagen cambian su cara al estilizar.
- **Outfit real** (de su foto en el espejo): pañuelo/wrap gris claro en la cabeza con rizos saliendo atrás, henley gris manga larga, correa negra con hebilla dorada, pantalón negro MUY ancho, mocasines marrón oscuro, pulsera roja de hilo + reloj plateado, aretes cuadrados de diamante. Complexión: alto y delgado normal (ni flaco extremo ni gordo), pelo corto-medio rizado debajo del wrap.
- Fotos suyas subidas a Higgsfield (media_id): `db28aa2e…` (espejo), `9bb3c30f…`, `93993a30…`, `0b804611…`, `c9176e23…`, `2aa966a4…`, `f37c535f…`, `a880c8ce…`, `ed87e512…`. Le gusta hacerlo **con los lentes negros envolventes** "para que sea más fácil".
- **Siguiente paso recomendado:** que Rubén se tome una foto real sentado orando con el outfit (pared lisa, buena luz, cuerpo completo; ideal también lado y espalda) y pasarla directo a 3D (Tripo ~34 créditos, o multi-imagen). Alternativas: entrenar Soul ID en Higgsfield, o un artista 3D.
- **22 nov (Claude Code):** render corregido `e82a6796…` (espalda recta pero wrap deformado; su 3D `70bd08aa…` se gastó por error). **Render final elegido: `c103598f-f930-4256-a51b-107070a9dea4`** (pose del primero + espalda recta + wrap redondo; copia en `escondite/rainn/rainn-orando-ref.png`). **3D final: job `6134c7ed-7d6a-4437-af25-bf36d5fe1d73`** (GLB en cloudfront `d8j0ntlcm91z4`, host bloqueado en la sesión cloud).
- Animación: por código (respiración + balanceo leve + cabeza), NO rig — no hay animación de orar en la librería y el auto-rig falla sentado.
- Para meter un GLB en el escondite: cargarlo con `GLTFLoader` (r128 examples) y aplicarle `glossify()` + la luz de su charco.

## Pendientes
1. Modelo de rainn orando (arriba). Luego repisa de figuras (4 personajes) y maniquí 1080 — ~34–38 créditos c/u, avisar costo.
2. Contenido real de cada sección: links de canciones, videos (shows, singles, detrás de cámaras), screenshots de métricas, imágenes del moodboard, small team (nombres/roles), fecha de *Nepo*, avance de cada proyecto, info de personajes.
3. Pulido: intro, pistas, rendimiento en celular.
4. Publicar en 1080colorado.com/rainn (sin tocar el juego).
5. Más adelante: EPK/kit de 1080 (colección, bolso, precios, pop-up del 1 de diciembre).

## Se mantiene del v1
Rojo de la mira como acento, **Inter Tight** en títulos, letras grandes y fáciles de leer. El link no debe decir "Claude".
