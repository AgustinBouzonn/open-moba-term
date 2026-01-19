# OPENMOBA (PROJECT CODENAME) - MASTER ARCHITECTURE DOCUMENTATION

**Versión:** 1.0.0 (RFC)
**Estrategia de Licencia:** GPLv3
**Filosofía del Core:** Rendimiento, Modularidad, No-Bloatware.

---

## ÍNDICE DE CONTENIDOS

1.  [Visión General y Stack Tecnológico](#1-visión-general-y-stack-tecnológico)
2.  [Arquitectura del Núcleo (Core System)](#2-arquitectura-del-núcleo-core-system)
3.  [Motor de Terminal y PTY](#3-motor-de-terminal-y-pty)
4.  [Networking Profundo: SSH y Multiplexación](#4-networking-profundo-ssh-y-multiplexación)
5.  [Sistema de Archivos Virtual (SFTP & VFS)](#5-sistema-de-archivos-virtual-sftp--vfs)
6.  [Puente X11 (X Window Server Bridge)](#6-puente-x11-x-window-server-bridge)
7.  [Protocolos Visuales (RDP/VNC)](#7-protocolos-visuales-rdp-vnc)
8.  [Seguridad y Criptografía](#8-seguridad-y-criptografía)
9.  [Persistencia y Gestión de Estado](#9-persistencia-y-gestión-de-estado)
10. [Estructura de Directorios Propuesta](#10-estructura-de-directorios-propuesta)

---

## 1. VISIÓN GENERAL Y STACK TECNOLÓGICO

El objetivo es crear un orquestador de sesiones multiprotocolo de última generación que elimine la deuda técnica y las características superfluas (juegos, easter eggs) de las soluciones actuales, priorizando drásticamente la velocidad de renderizado y la seguridad.

### Stack Tecnológico Elegido

| Componente | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Runtime** | **Electron** (Última versión estable) | Ecosistema maduro para desktop cross-platform con acceso a APIs nativas. |
| **Lenguaje** | **TypeScript** (Strict mode) | Tipado estático para escalabilidad y mantenibilidad "bulletproof". |
| **UI Framework** | **React** + **Emotion/Styled** | Gestión eficiente del estado de la vista y theming dinámico sin overhead runtime excesivo. |
| **Terminal Rendering** | **xterm.js** (WebGL renderer) | Estándar de la industria, aceleración hardware nativa. |
| **Process Management** | **node-pty** | Manejo robusto de pseudoterminales cross-platform. |
| **SSH Engine** | **ssh2** (Cliente nativo JS) | Implementación pura en JS, sin dependencias binarias externas para el protocolo base. |
| **X Server** | **VcXsrv** (Binario externo orquestado) | Servidor X robusto y compatible con Windows. |

---

## 2. ARQUITECTURA DEL NÚCLEO (CORE SYSTEM)

### 2.1 Modelo de Procesos (Actor Model)

Para garantizar que la UI nunca se congele ("jank-free"), la aplicación implementa una separación estricta de responsabilidades en tres capas de ejecución:

#### 1. Main Process (El Orquestador)
* **Rol:** Ciclo de vida y gestión de ventanas.
* **Responsabilidades:**
    * Creación y orquestación de `BrowserWindows`.
    * Gestión de menús nativos del sistema.
    * Actúa como "Traffic Controller" para el IPC, enrutando mensajes sin procesarlos.
    * Gestión de actualizaciones y diálogos del sistema.

#### 2. Renderer Process (La Vista)
* **Rol:** Dumb UI (Interfaz Tonta).
* **Responsabilidades:**
    * **No contiene lógica de conexión.**
    * Renderizado de componentes React.
    * Emisión de eventos de usuario (`USER_TYPED`, `CONNECT_REQUEST`, `RESIZE_TERM`).
    * Utiliza `SharedArrayBuffer` solo si es estrictamente necesario para pipes de alto rendimiento, aunque el IPC moderno de Electron suele ser suficiente.

#### 3. Background Workers (Hidden Renderer / Node Child Processes)
El "cerebro" real de la aplicación, invisible al usuario.
* **Service Worker A (SSH Manager):**
    * Mantiene los sockets TCP/SSH abiertos.
    * **Resiliencia:** Si la ventana UI se recarga (CRTL+R) o crashea, la conexión SSH **persiste** aquí y se reconecta a la UI al iniciarse de nuevo.
* **Service Worker B (IO Tasks):**
    * Operaciones pesadas en disco.
    * Parsing de archivos grandes (logs).
    * Hashing MD5/SHA256 para validación de transferencias.
    * Lógica del File System Virtual.

### 2.2 Estrategia IPC (Inter-Process Communication)
* **Protocolo:** Request/Response asíncrono basado en promesas con UUIDs para correlación.
* **Stream Tunneling (Zero-Latency):** Para el flujo crítico de la terminal, **no se serializa a JSON**. Se establece un `MessagePort` directo entre el proceso hijo que corre `node-pty` y el componente `xterm.js` en el Renderer para pipear `Buffer` o `Uint8Array` crudos.

---

## 3. MOTOR DE TERMINAL Y PTY

### 3.1 Abstracción PTY (Pseudo-Teletype)
Middle-layer para normalizar diferencias entre shells.

* **Detección Automática:** Soporte out-of-the-box para `PowerShell Core`, `CMD`, `WSL 1/2`, `Git Bash`, `Cygwin` y `MSYS2`.
* **Codificación (Encoding):**
    * Forzar `UTF-8` en todas las sesiones.
    * **Fix Windows Legacy:** Inyectar el comando `chcp 65001` al inicio de sesiones CMD/PowerShell antiguas para corregir renderizado de caracteres especiales y emojis.

### 3.2 Pipeline de Renderizado
1.  **Raw Data In:** Flujo de bytes entrante desde PTY local o SSH Stream.
2.  **Parser Intermedio (High-Performance Matcher):** Analiza el stream "on-the-fly" buscando patrones (URLs, rutas de archivos `C:\...` o `/var/...`, direcciones IP).
    * *Optimización:* Convierte estos patrones en "Decorations" o "Links" interactivos antes de pasarlos al motor de renderizado.
3.  **Render Final:** `xterm.js` configurado con el addon `WebGL`.
    * *Fallback Strategy:* Detección de fallos de contexto WebGL -> Fallback a Canvas (2D Context) -> Fallback final a DOM renderer (lento, solo emergencia).

### 3.3 Gestión de Redimensionado (Flow Control)
El redimensionado incorrecto es la causa #1 de interfaces TUI rotas (vim, htop).
1.  **Observer:** Uso de `ResizeObserver` nativo en el contenedor DOM.
2.  **Cálculo Preciso:** `cols = floor(width / charWidth)`, `rows = floor(height / charHeight)`.
3.  **Debounce Inteligente:** Limitar las llamadas de redimensionamiento al backend a máximo 1 cada 100-150ms para evitar saturar el canal SSH.
4.  **Sync:** Enviar señal `SIGWINCH` inmediata al proceso PTY local o mensaje `window-change` al canal SSH remoto.

---

## 4. NETWORKING PROFUNDO: SSH Y MULTIPLEXACIÓN

### 4.1 Ciclo de Vida de la Conexión (FSM)
Cada sesión se modela como una Máquina de Estados Finitos (FSM) estricta:
`IDLE` -> `DNS_RESOLVE` -> `TCP_CONNECT` -> `SSH_HANDSHAKE` -> `AUTH` -> `CHANNEL_ALLOCATION` -> `ACTIVE` -> `DISCONNECT`.

### 4.2 Multiplexación (Connection Sharing)
Característica crítica para el rendimiento en redes inestables o servidores con límites estrictos.
**Principio:** Una sola conexión TCP física por servidor destino, múltiples canales lógicos SSH sobre ella.

* **Master Connection:** Se establece al iniciar la primera pestaña.
* **Channel 0 (Shell):** Interactividad PTY (la terminal visible).
* **Channel 1 (SFTP):** Subsistema de transferencia de archivos (se abre automáticamente en background, "invisible" hasta que se usa).
* **Channel 2 (X11):** Forwarding gráfico (bajo demanda).
* **Channel N (Tunnels):** Port forwarding dinámico o local.

*Beneficio:* Evita el overhead del handshake criptográfico completo para el SFTP y reduce drásticamente el riesgo de ban por herramientas como `fail2ban` al reducir la huella de conexiones.

### 4.3 Keep-Alive y Latencia
* **TCP_NODELAY:** Activado (desactiva algoritmo de Nagle) para respuesta instantánea (latencia mínima) al teclear.
* **App Level Keep-Alive:** Enviar paquete `SSH_MSG_IGNORE` cada 20-30s si el canal está inactivo. Esto mantiene la tabla NAT del router "caliente" y evita desconexiones por timeout de firewalls corporativos.

---

## 5. SISTEMA DE ARCHIVOS VIRTUAL (SFTP & VFS)

### 5.1 Arquitectura VFS (Abstract File System)
Interfaz genérica (`ls`, `read`, `write`, `stat`, `mkdir`, `rm`) que desacopla la UI del explorador de archivos.
* **Backends soportados:** Inicialmente SFTP, pero extensible a FTP, S3, Docker Exec FS, o WSL FS.

### 5.2 Heurística "Follow Terminal"
El navegador SFTP lateral debe sincronizarse con la ruta actual de la terminal (`cd`).
* **Estrategia A (Shell Integration - Preferida):** Inyectar (con permiso del usuario) un "hook" en el shell remoto que emita un código de escape OSC (Operating System Command) invisible al cambiar de directorio: `printf "\033]7;file://%s\007" "$PWD"`.
* **Estrategia B (Regex - Fallback):** Monitorear el prompt visible en busca de patrones de ruta. (Menos fiable, propenso a errores con prompts personalizados).
* **Estrategia C (Polling - Último recurso):** Ejecutar `pwd` en un canal exec secundario cada X segundos (Desaconsejado: genera ruido en logs de auditoría como `bash_history`).

### 5.3 Flujo de Edición Remota
1.  **Trigger:** Doble clic en archivo remoto en el panel SFTP.
2.  **Action:** Descarga stream a caché temporal segura: `%TEMP%/openmoba/session_uuid/file.ext`.
3.  **Watch:** Iniciar `fs.watch()` sobre el archivo local.
4.  **Sync:**
    * Al detectar evento `change` en local.
    * Esperar 500ms (debounce) para asegurar que el editor terminó de escribir.
    * Subir cambios vía SFTP Stream.
    * Notificar éxito/error en la barra de estado.

---

## 6. PUENTE X11 (X WINDOW SERVER BRIDGE)

Capacidad de ejecutar aplicaciones GUI de Linux (Firefox, xclock) renderizadas en Windows.

### 6.1 Orquestación de VcXsrv
Empaquetado inteligente de `vcxsrv` (GPL).
* **Startup Automático:** El proceso Main lanza `vcxsrv.exe` como hijo si se requiere X11.
* **Flags Optimizados:**
    * `-multiwindow`: Integración nativa (cada app Linux es una ventana Windows en la barra de tareas).
    * `-clipboard`: Sincronización bidireccional de portapapeles.
    * `-wgl`: Aceleración por hardware OpenGL si es posible.
    * `-ac`: Desactivar control de acceso (dependemos del túnel SSH para la seguridad).

### 6.2 Lógica de Forwarding
1.  **Request:** Cliente SSH solicita `x11-req` al servidor remoto durante la sesión.
2.  **Display:** Servidor remoto asigna `DISPLAY` (ej: `localhost:10.0`).
3.  **Traffic Flow:**
    * App Linux -> Socket Unix Remoto.
    * Servidor SSH -> Canal SSH seguro "x11".
    * Cliente SSH (OpenMoba) -> Recibe stream.
    * **Bridging:** OpenMoba abre socket TCP local a `localhost:6000` (VcXsrv) y realiza un `pipe` bidireccional entre el canal SSH y VcXsrv.

### 6.3 Magic Cookie (XAuth) - Seguridad Reforzada
Para evitar que otros usuarios en la máquina local se conecten al servidor X:
1.  Generar token aleatorio (Magic Cookie) en OpenMoba.
2.  Configurar VcXsrv para requerir autenticación `XDM-AUTHORIZATION-1` o `MIT-MAGIC-COOKIE-1`.
3.  Inyectar token en el servidor remoto usando `xauth add` antes de lanzar aplicaciones.

---

## 7. PROTOCOLOS VISUALES (RDP/VNC)

### 7.1 RDP (Remote Desktop Protocol)
* **Engine:** Wrapper nativo sobre **FreeRDP** (estándar industrial, robusto). Evitar implementaciones JS puras por rendimiento.
* **Rendering:** FreeRDP decodifica frames -> Escribe en Shared Memory / Bitmap Buffer -> Electron dibuja en `<canvas>` de alta performance.
* **Input Translation:** Mapeo exhaustivo de eventos JS (`KeyboardEvent`) a Scancodes de Windows nativos para enviar al servidor RDP.

### 7.2 VNC (Virtual Network Computing)
* **Engine:** **noVNC** (versión adaptada/forkeada).
* **Transporte Híbrido:**
    * Si el servidor VNC soporta WebSockets: Conexión directa desde Renderer.
    * Si es VNC clásico (TCP puro): Usar el proceso Background Worker como proxy TCP-to-WebSocket local (Bridge) para que el renderer pueda conectarse.

---

## 8. SEGURIDAD Y CRIPTOGRAFÍA

### 8.1 Gestión de Secretos en Memoria (RAM)
* **Buffer vs String:** Las contraseñas y llaves privadas **DEBEN** manejarse como `Uint8Array` o `Buffer`.
* **Wiping:** Esto permite sobrescribirlas con ceros (`.fill(0)`) explícitamente cuando ya no se necesiten. Los `String` en V8 son inmutables y persisten en memoria hasta que el Garbage Collector decide actuar, lo cual es un riesgo de seguridad en volcados de memoria.

### 8.2 Almacenamiento "At Rest" (Disco)
* **System Keyring (Default):** Usar `keytar` para delegar la custodia de credenciales al OS (Windows Credential Manager / macOS Keychain / libsecret).
* **Portable Mode (USB):**
    * Pedir "Master Password" al inicio.
    * Derivar llave de cifrado (KEK) usando algoritmo robusto a memoria: **Argon2id**.
    * Cifrar todo el JSON de configuración/credenciales usando **AES-256-GCM**.

### 8.3 Sanitización (Paste Protection)
Prevención de ataques de inyección de comandos vía portapapeles.
* **Lógica:** Si el contenido del portapapeles contiene caracteres de control peligrosos (`\n`, `\r`) y la longitud es > 2 caracteres:
* **Intervención:** Intercept el evento `paste`, pausar, y mostrar un modal de confirmación limpio mostrando los comandos exactos que se ejecutarán, advirtiendo si hay múltiples líneas.

---

## 9. PERSISTENCIA Y GESTIÓN DE ESTADO

### 9.1 Base de Datos de Sesiones
* Estructura JSON plana normalizada para facilitar búsquedas y sincronización.
* **Herencia Jerárquica:** Implementar sistema de "Carpetas/Grupos".
    * Una carpeta puede definir credenciales (Usuario/Pass/Key) o configuraciones SSH (Puerto, Proxy Jump).
    * Las sesiones hijas heredan estas propiedades automáticamente a menos que se sobrescriban explícitamente.

### 9.2 Recuperación de Desastres (Crash Recovery)
* **Auto-Save:** Escribir estado de las pestañas activas (IDs, rutas, layout) en disco cada 60 segundos.
* **Startup:** Al iniciar, detectar si hubo un cierre inesperado (flag sucio).
* **Restore:** Leer `session_restore.json` y relanzar las conexiones automáticamente para minimizar el tiempo de inactividad del DevOps/SysAdmin.

---

## 10. ESTRUCTURA DE DIRECTORIOS PROPUESTA

```text
/
├── src/
│   ├── main/                 # Main Process (Electron)
│   │   ├── index.ts          # Entry point
│   │   ├── windows/          # Window management
│   │   └── ipc/              # IPC Routers
│   ├── renderer/             # Renderer Process (React UI)
│   │   ├── components/       # Reusable UI components
│   │   ├── terminals/        # xterm.js wrappers & addons
│   │   └── views/            # Main views (SessionManager, TerminalView)
│   ├── worker/               # Background Workers (Hidden)
│   │   ├── ssh/              # SSH connection pooling logic
│   │   ├── sftp/             # SFTP logic & buffering
│   │   └── pty/              # node-pty management
│   └── shared/               # Tipos y utilidades compartidas
├── assets/                   # Iconos, imágenes estáticas
├── resources/                # Binarios externos (vcxsrv, tools)
└── package.json
```
