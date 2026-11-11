# ServiTrack - Plataforma de Gestión de Servicios Técnicos
Aplicación desarrollada en HTML, CSS, y JavaScript, orientada a la trazabilidad, control y métricas en tiempo real de operaciones de mantenimiento técnico de sistemas y seguridad.

## Características:
- 100% en Español.
- Datos depurados y en blanco, listos para ambiente de producción.
- Dashboard analítico con colores de impacto (Neurolingüística).
- Control de Accesos (Admin, Operador, Técnico).
- Módulo de Ajustes: Clientes, Sedes, Tiempos meta, y personalización de etiquetas.
- Georreferenciación simulada con Mapas OpenStreetMap (Leaflet).
- Generación de PDF local.

## Instrucciones de Despliegue Masivo (Paso a Paso)

### Opción 1: Despliegue Inmediato en Netlify (Recomendado)
1. Extrae el contenido de este archivo `.zip` en una carpeta de tu computadora (asegúrate de que el archivo `index.html` quede en la raíz de esa carpeta).
2. Abre tu navegador y ve a [Netlify Drop](https://app.netlify.com/drop).
3. Inicia sesión o crea una cuenta en Netlify (puedes usar GitHub).
4. Arrastra la carpeta que acabas de extraer y suéltala en el círculo punteado de Netlify Drop.
5. ¡Listo! Netlify te generará una URL pública inmediatamente.
6. (Opcional) Ve a "Site Settings" -> "Change site name" para colocarle un nombre personalizado (ej. servitrack-app.netlify.app).

### Opción 2: Subida Masiva vía GitHub y conexión a Netlify
1. Extrae los archivos de este `.zip`.
2. Ve a [GitHub](https://github.com/) e inicia sesión.
3. Haz clic en **"New Repository"** (Nuevo Repositorio). Ponle un nombre (ej. `servitrack-app`), ponlo Público o Privado y dale "Create repository".
4. Abre **GitHub Desktop** en tu PC, clona ese repositorio vacío.
5. Copia todos los archivos extraídos del ZIP y pégalos dentro de la carpeta clonada en tu PC.
6. En GitHub Desktop, pon un título al Commit (ej. "Initial Commit - ServiTrack"), dale a **Commit to main** y luego **Push origin**.
7. Ve a [app.netlify.com](https://app.netlify.com/), haz clic en **"Add new site" -> "Import an existing project"**.
8. Selecciona GitHub, autoriza, selecciona el repositorio `servitrack-app` y haz clic en **"Deploy site"**.
9. Cualquier cambio que hagas en el código y subas a GitHub se actualizará automáticamente en tu App web de Netlify en segundos.
