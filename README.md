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
| Plan de trabajo | `/propuestas/:id/plan` | Documento completo de la candidatura, con índice, tablas y anexos |
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
| Descarga del acta de resultados en PDF | botón en `/resultados` |

Para crear administradores adicionales con contraseñas temporales seguras:

```powershell
cd backend
# Crea los dos administradores por defecto (coordinacion y bienestar)
..\env\Scripts\python.exe manage.py crear_administradores

# Crear uno con otro nombre
..\env\Scripts\python.exe manage.py crear_administradores --usuario registro --nombre "Área de Registro"

# Con acceso también al admin completo de Django
..\env\Scripts\python.exe manage.py crear_administradores --usuario jefe --superusuario
```

El comando genera contraseñas aleatorias y **solo las muestra una vez**, al crear la cuenta; no
sobrescribe la contraseña de un usuario que ya exista. Cada administrador puede cambiarla después
desde el admin de Django.

Administradores actuales:

| Usuario | Nombre | Perfil |
| --- | --- | --- |
| `dancadev` | — | Superusuario |
| `coordinacion` | Coordinación Académica | Administrador |
| `bienestar` | Bienestar al Aprendiz | Administrador |

> Las contraseñas se entregan aparte; no se guardan en el repositorio.

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

### Descarga del acta en PDF

El administrador descarga el acta de resultados desde el botón **Descargar resultados en PDF** en
`/resultados` (disponible incluso antes de publicar los resultados). El documento lo genera el
backend con ReportLab (`apps/elecciones/reportes.py`) e incluye:

* encabezado institucional del Centro y la Regional;
* datos de la jornada: estado, hora límite, fecha de cierre y fecha de generación;
* total de votos y candidatos del tarjetón;
* gráfico de barras por opción;
* tabla de escrutinio con votos, porcentaje y estado de cada candidato;
* bloque destacado con la mayor votación;
* notas al pie, entre ellas la advertencia de que los resultados aún no están publicados cuando
  ese sea el caso.

Usa una fuente TrueType del sistema (Arial, con reserva a Verdana o DejaVu) para que los nombres
con tildes y eñes salgan correctos. El endpoint `GET /api/elecciones/resultados/pdf/` responde
**401** sin sesión y **403** a un votante: el PDF es exclusivo del administrador.

Dependencia añadida al entorno: `reportlab`.

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

## Planes de trabajo de los candidatos

Cada candidato puede tener un **plan de trabajo** publicado, que se consulta en
`/propuestas/<id>/plan`.

El plan **no** se guarda como un bloque de texto, sino como **secciones estructuradas**
(modelo `PlanTrabajo`, campo `secciones`), porque los documentos combinan párrafos, listas,
tablas, secuencias y bloques destacados. La página del frontend
(`components/votacion/PlanTrabajo.jsx`) es la **plantilla**: renderiza cualquier plan cargado en
ese formato, así que todos los candidatos se ven igual sin tocar el frontend.

### Tipos de bloque

| Bloque | Formato |
| --- | --- |
| Párrafo | `{"tipo": "parrafo", "texto": "..."}` |
| Lista | `{"tipo": "lista", "estilo": "vinetas"\|"numeros", "items": [...]}` |
| Destacado | `{"tipo": "destacado", "etiqueta": "...", "texto": "..."}` |
| Secuencia | `{"tipo": "secuencia", "items": ["Escuchar", "Priorizar", ...]}` |
| Tabla | `{"tipo": "tabla", "columnas": [...], "filas": [[...], ...]}` |

Cada sección se ve así:

```json
{ "numero": "6.1", "titulo": "Eje de bienestar", "nivel": 2, "proyecto": "Lope te escucha",
  "bloques": [ { "tipo": "parrafo", "texto": "..." } ] }
```

`nivel: 1` son los capítulos principales (aparecen en el índice) y `nivel: 2` las subsecciones.

### Cargar un plan

El plan de **Jhonatan Rolando Arcos Portillo** (candidato #1) está incluido en el comando y sirve
de modelo: son 25 secciones basadas en su documento *Plan de Trabajo y Propuestas 2026*.

```powershell
cd backend

# Ver la estructura de un plan ya cargado
..\env\Scripts\python.exe manage.py cargar_plan_trabajo --candidato 1 --mostrar

# Cargar el plan modelo en el candidato #1
..\env\Scripts\python.exe manage.py cargar_plan_trabajo --candidato 1

# Crear el plan de otro candidato con la MISMA estructura, para completarla
..\env\Scripts\python.exe manage.py cargar_plan_trabajo --candidato 3 --plantilla-vacia

# Cargar un plan desde un archivo JSON propio
..\env\Scripts\python.exe manage.py cargar_plan_trabajo --candidato 2 --archivo planes_de_trabajo\sol_felipe_solarte.json

# Cambiar solo el resumen que aparece en la tarjeta del módulo de propuestas
..\env\Scripts\python.exe manage.py cargar_plan_trabajo --candidato 2 --resumen "Texto corto de la tarjeta"
```

`--plantilla-vacia` reproduce los 25 apartados del plan modelo (mismos títulos, secciones y
tablas) pero sin contenido, listo para que cada candidato lo complete.

El archivo JSON que espera `--archivo` tiene esta forma. El campo `resumen` es opcional y es el
texto corto de la tarjeta del módulo de propuestas:

```json
{
  "titulo": "Programa de Representación Estudiantil",
  "eslogan": "Gestión participativa, transparencia comunicativa...",
  "lema": "Comunicar • Integrar • Veedurar",
  "vigencia": "2026",
  "resumen": "Texto corto para la tarjeta del módulo de propuestas.",
  "secciones": [ ... ]
}
```

Si cargas con `--archivo` y no incluyes `resumen` ni pasas `--resumen`, el comando **no toca** el
resumen de la tarjeta y avisa por consola: así no se reemplaza el texto de un candidato con el de
otro.

Antes de guardar, el comando **valida** el plan y no escribe nada si encuentra errores: tipos de
bloque desconocidos, secciones sin número o con número repetido, listas sin `items` o tablas cuyas
filas no coinciden con el número de columnas.

En el admin (`/admin/elecciones/plantrabajo/`) se puede revisar cada plan, ver el índice de sus
secciones y publicarlo o despublicarlo. Mientras un candidato no tenga plan, su micrositio muestra
un aviso en lugar del botón al documento.

### Planes cargados

| Candidato | Plan | Secciones | Fuente |
| --- | --- | --- | --- |
| #1 Jhonatan Rolando Arcos Portillo | Plan de Trabajo y Propuestas | 25 | PDF *Plan de Trabajo Candidatura Representante Aprendices 2026-2027* |
| #2 Sol Felipe Solarte A | Programa de Representación Estudiantil | 20 | DOCX *SOL PROGRAMA DE REPRESENTACIÓN ESTUDIANTIL* |
| #3 Yeremmy Steven Rodríguez Delgado | Propuesta de Gestión y Análisis Normativo de la Comunidad Aprendiz | 21 | PDF *Propuesta_Gestion_y_Reglamento_SENA_Centro_Lope* |
| #4 Yefri Miguel Olaya Obregón | Propuesta de Candidatura a Representante de los Aprendices | 22 | PDF *Propuesta Candidatura Yefri Olaya* |

Los cuatro candidatos del tarjetón tienen su plan publicado. Los archivos de
`backend/planes_de_trabajo/` quedan como ejemplos del formato:

* `sol_felipe_solarte.json` — tres pilares, tablas de fundamentación normativa, matriz de
  ejecución, cronograma, anexos de consejos estratégicos y glosario.
* `yeremmy_rodriguez.json` — tres horizontes temporales, tabla de análisis del Acuerdo 009 de
  2024 y matriz de ejecución por fases.
* `yefri_olaya.json` — seis líneas de trabajo, cada una con su tabla de acciones a corto, mediano
  y largo plazo, y secciones explícitas de «lo que no prometo» y de verificación.

## Autenticación en la API

| Cabecera | Uso |
| --- | --- |
| `Authorization: Token <token>` | Administrador (DRF `authtoken`) |
| `X-Votante-Token: <token>` | Votante, emitido al validar la cédula (vive en caché, 4 horas) |

Endpoints principales:

```
POST /api/auth/login/            POST /api/auth/logout/       GET /api/auth/yo/
GET  /api/elecciones/propuestas/ GET  /api/elecciones/candidatos/<id>/
GET  /api/elecciones/candidatos/<id>/plan/
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
