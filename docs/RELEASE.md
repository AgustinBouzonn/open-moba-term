# Proceso de release

Las versiones se publican con el workflow [`build.yml`](../.github/workflows/build.yml) de GitHub Actions.

## Antes de publicar

1. Actualizá el campo `version` de `package.json`. Los nombres de los instaladores salen de ahí.
2. Agregá la nueva versión a [`CHANGELOG.md`](../CHANGELOG.md).
3. Verificá que el CI esté en verde en `main`.

## Publicar una versión

Creá y subí un tag con el formato `v*`, igual a la versión de `package.json`:

```bash
git tag -a v1.0.5 -m "Release v1.0.5"
git push origin v1.0.5
```

El workflow entonces:

1. Compila en Windows, macOS y Linux con Node 20.
2. Genera los instaladores en la carpeta `release/`.
3. Crea el release en GitHub con esos archivos y notas generadas automáticamente.

| Plataforma | Instalador |
|---|---|
| Windows | `OpenMoba-<versión>-Setup.exe`, instalador NSIS x64 |
| macOS | `.dmg` |
| Linux | `.AppImage` y `.deb` |

Lanzar el workflow a mano desde Actions compila los instaladores y los deja como artefactos de la corrida, sin crear un release.

## Compilar localmente

```bash
npm run build          # sistema operativo actual
npm run build:win      # o build:mac / build:linux
npm run dist:dir       # app sin instalador, para probar el empaquetado
```

Los archivos quedan en `release/`.

## Versionado

Seguimos [Semantic Versioning](https://semver.org/lang/es/): MAJOR para cambios incompatibles, MINOR para funciones nuevas compatibles y PATCH para correcciones.
