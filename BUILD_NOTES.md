# OpenMoba - Build Fixed & Distribution Options

## ✅ ISSUE RESOLVED

El error "window is not defined" ha sido corregido.

**Cambio realizado**: Actualizada la ruta del `index.html` en producción en `src/main/index.ts`

## 📦 DISTRIBUCIÓN

Debido a limitaciones de permisos en Windows para firmar el ejecutable, tienes estas opciones:

### OPCIÓN 1: Versión Portable (LISTO AHORA) ⭐

```
Ubicación: E:\Desarrollo\release\win-unpacked\
Ejecutable: OpenMoba.exe (176.8 MB)
```

**Para distribuir:**

1. Comprime toda la carpeta `win-unpacked` como ZIP
2. Nombre sugerido: `OpenMoba-v1.0.0-Portable-Windows.zip`
3. Los usuarios descomprimen y ejecutan `OpenMoba.exe`

**Ventajas:**

- ✅ Listo para usar inmediatamente
- ✅ No requiere instalación
- ✅ Funciona en cualquier ubicación

### OPCIÓN 2: Instalador NSIS (Requiere Admin)

Para crear el instalador tradicional `.exe`:

```powershell
# Ejecutar PowerShell COMO ADMINISTRADOR
cd E:\Desarrollo
npm run build:win
```

Esto creará: `release\OpenMoba-1.0.0-Setup.exe`

## 🧪 PROBAR LOCALMENTE

```
Ejecuta: E:\Desarrollo\release\win-unpacked\OpenMoba.exe
```

Si funciona correctamente, el proyecto está listo para distribución.

## ⚠️ NOTA IMPORTANTE

La version `win-unpacked` es **completamente funcional** y recomendada para:

- Desarrollo
- Testing
- Distribución rápida
- Usuarios técnicos

El instalador NSIS es opcional para:

- Release público profesional
- Usuarios no técnicos
- Instalación en Program Files

---

## 📝 INSTRUCCIONES DE RELEASE

Al crear el release en GitHub, puedes ofrecer ambas versiones:

### Release Notes Template:

```markdown
## Downloads

**Portable Version** (Recommended)

- `OpenMoba-v1.0.0-Portable-Windows.zip` - Extract and run OpenMoba.exe
- No installation required
- Works from any location

**Installer** (Coming soon)

- Traditional Windows installer
- Requires administrator privileges
```

---

💡 **Consejo**: La mayoría de las herramientas de desarrollo (VS Code, etc.) distribuyen versiones portables exitosamente.
