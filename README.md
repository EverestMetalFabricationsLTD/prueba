# Everest Metal Fabrications — sitio web

Sitio estático de una sola página (HTML + CSS + JS, sin frameworks).

## Estructura

```
index.html      página completa
styles.css      estilos
script.js       interacciones (menú, partículas, scrollytelling, lightbox, FAQ)
assets/img/     imágenes optimizadas (WebP)
```

## Imágenes

- Cada foto tiene dos versiones:
  - `nombre.webp`: máx. 900 px, es la que se ve en la página
  - `nombre-lg.webp`: máx. 1600 px, se abre en el lightbox y en Projects
- Para agregar una foto nueva (con ImageMagick):

```
convert foto.jpg -auto-orient -strip -resize "900x900>"   -quality 76 assets/img/nombre.webp
convert foto.jpg -auto-orient -strip -resize "1600x1600>" -quality 72 assets/img/nombre-lg.webp
```

- Galería: copia un bloque `.gal-item` dentro de `.gallery-bento` y elige el tamaño
  (`gb-sq`, `gb-wide`, `gb-tall`, `gb-half`, `gb-full`).
- Catálogo: agrega un `.catalog-thumb` dentro de la tarjeta y actualiza el número en `.catalog-photo-count`.

## Pendiente

- Cuando haya dominio, poner la URL completa en `og:image` (está marcado con un comentario en el `<head>`).
