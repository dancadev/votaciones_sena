# votaciones_sena

Sistema de votaciones para el SENA: **Django + DRF** en el backend y **React + Vite + Tailwind** en el frontend.

El padrón electoral son los **8.345 aprendices** de la `BASE DE DATOS 2026` (ver
[Cargar el padrón de votantes](#cargar-el-padrón-de-votantes)).

## Perfiles del sistema

El sistema separa los componentes según el perfil que inicia sesión.

### Público (sin sesión)

| Componente | Ruta | Descripción |
| --- | --- | --- |
| Inicio | `/` | Página de entrada con accesos por perfil |
| Propuestas | `/propuestas` | **Siempre habilitado**. Muestra los 4 candidatos. No tiene botones de votar ni voto en blanco |
| Micrositio del candidato | `/propuestas/:id` | Perfil (foto, número de tarjetón) y propuestas completas |
| Resultados | `/resultados` | Solo visible cuando el administrador los publica |

> El **voto en blanco no aparece** en el módulo de propuestas (no tiene propuesta que consultar),
> pero **sí es una casilla del tarjetón dentro de la cabina de votación**, en su propia sección
> bajo los candidatos.

### Votante (sin usuario ni contraseña)

El votante **no tiene cuenta**. El administrador valida su cédula en el módulo de ingreso y
con eso queda habilitado:

1. El administrador busca la cédula en `/admin/ingreso` y pulsa **Validar ingreso**.
2. El votante abre `/cabina`, confirma su cédula y recibe un token temporal.
3. Vota en la tarjeta del candidato —o en la casilla de **voto en blanco**— y confirma.

Reglas aplicadas:

* Sin la validación del administrador la cabina responde **403**.
* Una cédula que ya votó no puede volver a entrar ni votar (**un voto por votante**).
* El voto es **secreto**: se guarda el sufragio sin asociarlo a la persona; por separado se marca
  `ya_voto` para impedir el doble voto.

### Administrador (usuario y contraseña de Django)

Entra en `/admin/login` con un usuario `is_staff` (se crea con `createsuperuser`). Solo este
perfil puede:

| Componente | Ruta |
| --- | --- |
| Validación de ingreso | `/admin/ingreso` |
| Monitor en vivo | `/monitor` |
| Cierre de jornada y publicación de resultados | botones del monitor |

## Cierre de jornada y publicación de resultados

* La hora límite de votación se configura en `EstadoElectoral.hora_cierre_votacion`
  (**por defecto 4:00 p.m.**).
* Antes de esa hora el monitor permite **forzar** el cierre si ya no queda nadie votando.
* Al cerrar la jornada, los resultados se publican en una sola acción y quedan visibles
  **para administradores y votantes**.
* Si aún queda gente en la fila, el administrador puede **reabrir** la votación; al hacerlo los
  resultados se ocultan de nuevo.
* Los administradores pueden consultar el escrutinio en cualquier momento, incluso con la
  jornada abierta.

## Puesta en marcha

### Backend

```powershell
cd backend
..\env\Scripts\python.exe manage.py migrate
..\env\Scripts\python.exe manage.py createsuperuser        # si aún no existe el administrador
..\env\Scripts\python.exe manage.py preparar_jornada       # estado de la jornada y hora límite
..\env\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

`preparar_jornada` acepta `--hora-cierre HH:MM` y `--sin-activar`.

### Frontend

```powershell
cd frontend\votaciones
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173` y consume la API en `http://127.0.0.1:8000/api`.

### Cargar el padrón de votantes

El padrón sale de la **BASE DE DATOS 2026** (`backend/BASE DE DATOS 2026.xlsx`), el Excel de
aprendices del SENA. Trae 8.345 aprendices con estas columnas:

```
No. | FICHA | PROGRAMA | NIVEL_DE_FORMACION | TIPO_DOCUMENTO |
NUMERO_DOCUMENTO | NOMBRE | PRIMER_APELLIDO | SEGUNDO_APELLIDO
```

El comando detecta solo la fila de encabezados (en este archivo es la 2.ª, porque la primera es un
separador), así que también acepta archivos con encabezados en otra posición:

```powershell
cd backend
# Simula la importación y muestra el resumen, sin escribir nada
..\env\Scripts\python.exe manage.py cargar_votantes --simular

# Importa o actualiza el padrón (no borra a nadie)
..\env\Scripts\python.exe manage.py cargar_votantes

# Borra el padrón actual y lo reemplaza por el del archivo
..\env\Scripts\python.exe manage.py cargar_votantes --reemplazar

# Indicando otro archivo
..\env\Scripts\python.exe manage.py cargar_votantes --archivo "C:\ruta\BASE DE DATOS 2026.xlsx"
```

Qué guarda cada columna:

| Columna del Excel | Campo del modelo |
| --- | --- |
| `NUMERO_DOCUMENTO` | `documento` (llave única del padrón) |
| `TIPO_DOCUMENTO` | `tipo_documento` (CC, TI, CE, PPT) |
| `NOMBRE` | `primer_nombre` |
| `PRIMER_APELLIDO` | `primer_apellido` |
| `SEGUNDO_APELLIDO` | `segundo_apellido` |
| `NOMBRE` + apellidos | `nombre_completo` (armado por el importador) |
| `PROGRAMA` | `programa_o_dependencia` |
| `FICHA` | `ficha` |
| `NIVEL_DE_FORMACION` | `nivel_de_formacion` |
| `No.` | se ignora: es el consecutivo del archivo |

Notas del importador:

* `NUMERO_DOCUMENTO` es la llave: vienen 8.345 documentos únicos y ninguno se repite.
* Los 72 aprendices sin `SEGUNDO_APELLIDO` quedan con ese campo vacío, sin texto `nan`.
* Si el documento ya existe, se **actualizan los datos personales** y se conservan
  `ingreso_registrado`, `ya_voto` y sus fechas: volver a importar a mitad de jornada no borra el
  estado de la votación.
* Con `--reemplazar` sí se borra todo el padrón, incluidos ingresos y marcas de voto.

Dónde se consultan estos datos:

* **Módulo de ingreso** (`/admin/ingreso`): muestra tipo y número de documento, programa, ficha y
  nivel de formación para verificar a la persona antes de habilitarla.
* **Cabina de votación**: tras validar la cédula, confirma en pantalla documento, ficha y programa.
* **Admin de Django** (`/admin/votantes/votante/`): lista con búsqueda por documento, nombre,
  apellidos o ficha, y filtros por tipo de documento, nivel de formación, ingreso y voto.
  Para consultar por ficha usa el buscador: hay 356 fichas distintas y no conviene como filtro.


## Administración de candidatos

Los candidatos se editan en el admin de Django (`/admin`), modelo **Candidato**:

* `numero_tarjeton`: número del tarjetón (1 a 4 para los candidatos).
* `nombre`, `propuesta`, `foto`: perfil que se muestra en el micrositio.
* `activo`: visible u oculto. En los candidatos controla el tarjetón; en el **voto en blanco**
  controla si la casilla aparece en la cabina.
* `es_voto_blanco`: marca el registro que representa el voto en blanco. Es una casilla del
  tarjetón de la cabina (no del módulo de propuestas) y sus votos cuentan en el escrutinio como
  "VB". Para ocultarlo de la cabina, desmarca `activo`.

Para comprobar el estado del tarjetón y del voto en blanco:

```powershell
cd backend
..\env\Scripts\python.exe manage.py preparar_jornada --sin-activar
```

## Autenticación en la API

| Cabecera | Uso |
| --- | --- |
| `Authorization: Token <token>` | Administrador (DRF `authtoken`) |
| `X-Votante-Token: <token>` | Votante, emitido al validar la cédula (vive en caché, 4 horas) |

Endpoints principales:

```
POST /api/auth/login/            POST /api/auth/logout/       GET /api/auth/yo/
GET  /api/elecciones/propuestas/ GET  /api/elecciones/candidatos/<id>/
GET  /api/elecciones/tarjeton/   GET  /api/elecciones/estado/
POST /api/elecciones/votar/
POST /api/votantes/validar/      GET  /api/votantes/sesion/
GET  /api/elecciones/total-realtime/    (administrador)
POST /api/elecciones/cerrar-jornada/    (administrador)
POST /api/elecciones/reabrir-jornada/   (administrador)
GET  /api/elecciones/resultados/        (según publicación)
```

`/propuestas/` y `/tarjeton/` no son lo mismo:

* `/propuestas/` alimenta el módulo público: los 4 candidatos, **sin** voto en blanco.
* `/tarjeton/` alimenta la cabina: los 4 candidatos **más** la casilla de voto en blanco en un
  campo aparte (`voto_en_blanco`), porque no tiene propuesta que consultar.
