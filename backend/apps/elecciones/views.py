"""API de elecciones.

Reglas de acceso:

* **Público** (propuestas y micrositios): siempre habilitado, sin importar el
  estado de la jornada.
* **Administrador**: monitor en vivo, cierre de jornada, publicación de
  resultados y todas las cifras antes del cierre.
* **Votantes y administradores**: resultados, solo cuando el administrador
  cerró la jornada y habilitó su publicación después de la hora límite.

El voto es secreto: se guarda el sufragio sin asociarlo al votante, y por
separado se marca a la persona como "ya votó" para impedir el doble voto.
"""

from django.db import transaction
from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.votantes import tokens
from apps.votantes.models import Votante

from . import reportes
from .models import Candidato, EstadoElectoral, Voto
from .permissions import EsAdministrador
from .serializers import (
    CandidatoSerializer,
    EstadoElectoralSerializer,
    PlanTrabajoSerializer,
)


# --------------------------------------------------------------------------- #
# Utilidades de estado
# --------------------------------------------------------------------------- #

def obtener_estado():
    estado, _ = EstadoElectoral.objects.get_or_create(id=1)
    return estado


def tope_de_votacion_alcanzado(estado):
    """True si ya pasó la hora límite configurada para votar (por defecto 4:00 p.m.)."""
    if not estado.hora_cierre_votacion:
        return False
    hora_limite = timezone.localtime().replace(
        hour=estado.hora_cierre_votacion.hour,
        minute=estado.hora_cierre_votacion.minute,
        second=estado.hora_cierre_votacion.second,
        microsecond=0,
    )
    return timezone.localtime() >= hora_limite


def resultados_habilitados(estado):
    """Los resultados se consultan solo si el administrador los publicó."""
    return estado.resultados_publicos


def candidatos_tarjeton():
    """Candidatos visibles del tarjetón, en orden (sin el voto en blanco).

    Es lo que se muestra en el módulo de propuestas y en los micrositios, donde
    el voto en blanco no tiene cabida porque no tiene propuesta.
    """
    return Candidato.objects.filter(activo=True, es_voto_blanco=False)


def voto_en_blanco():
    """Registro del voto en blanco que se ofrece dentro de la cabina."""
    return Candidato.objects.filter(es_voto_blanco=True, activo=True).first()


def candidatos_para_votar():
    """Opciones que se pueden marcar en la cabina: candidatos + voto en blanco."""
    return Candidato.objects.filter(activo=True)


def candidatos_para_conteo():
    """Todos los candidatos, incluido el voto en blanco, para el escrutinio."""
    return Candidato.objects.all()


def datos_estado_publico(estado):
    return {
        'jornada_activa': estado.is_activa,
        'hora_cierre_votacion': estado.hora_cierre_votacion,
        'tope_de_votacion_alcanzado': tope_de_votacion_alcanzado(estado),
        'fecha_cierre': estado.fecha_cierre,
        'resultados_publicos': estado.resultados_publicos,
        'resultados_habilitados': resultados_habilitados(estado),
        'puede_cerrar_jornada': estado.is_activa and tope_de_votacion_alcanzado(estado),
    }


# --------------------------------------------------------------------------- #
# Endpoints públicos
# --------------------------------------------------------------------------- #

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_candidatos(request):
    """Tarjetón: los candidatos visibles, con su propuesta."""
    serializer = CandidatoSerializer(candidatos_tarjeton(), many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def tarjeton_votacion(request):
    """Opciones de la cabina de votación.

    A diferencia del módulo de propuestas, aquí **sí** se incluye el voto en
    blanco: es una opción válida del tarjetón y se ofrece en una casilla aparte
    porque no tiene propuesta que consultar.
    """
    candidatos = list(candidatos_tarjeton())
    blanco = voto_en_blanco()
    return Response({
        'jornada_activa': obtener_estado().is_activa,
        'candidatos': CandidatoSerializer(candidatos, many=True, context={'request': request}).data,
        'voto_en_blanco': (
            CandidatoSerializer(blanco, context={'request': request}).data if blanco else None
        ),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_propuestas(request):
    """Módulo de propuestas: siempre habilitado y sin voto en blanco.

    No depende del estado de la jornada: las propuestas se pueden consultar
    antes, durante y después de la votación.
    """
    candidatos = list(candidatos_tarjeton())
    serializer = CandidatoSerializer(candidatos, many=True, context={'request': request})
    return Response({
        'habilitado': True,
        'total_candidatos': len(candidatos),
        'propuestas': serializer.data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def detalle_candidato(request, candidato_id):
    """Micrositio del candidato: perfil y propuesta completa."""
    candidato = Candidato.objects.filter(id=candidato_id, activo=True, es_voto_blanco=False).first()
    if candidato is None:
        return Response({'error': 'Candidato no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    serializer = CandidatoSerializer(candidato, context={'request': request})
    return Response({'candidato': serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def plan_trabajo_candidato(request, candidato_id):
    """Plan de trabajo del candidato, con sus secciones estructuradas.

    Siempre disponible, igual que las propuestas: forma parte de la
    documentación pública de la candidatura.
    """
    candidato = Candidato.objects.filter(id=candidato_id, activo=True, es_voto_blanco=False).first()
    if candidato is None:
        return Response({'error': 'Candidato no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    plan = getattr(candidato, 'plan_trabajo', None)
    if plan is None or not plan.publicado:
        return Response(
            {
                'error': 'Este candidato aún no ha publicado su plan de trabajo',
                'candidato': CandidatoSerializer(candidato, context={'request': request}).data,
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({'plan': PlanTrabajoSerializer(plan, context={'request': request}).data})


@api_view(['GET'])
@permission_classes([AllowAny])
def estado_jornada(request):
    return Response(datos_estado_publico(obtener_estado()))


# --------------------------------------------------------------------------- #
# Votación
# --------------------------------------------------------------------------- #

@api_view(['POST'])
@permission_classes([AllowAny])
def registrar_voto(request):
    """Registra el voto del votante cuya cédula fue validada por el administrador."""
    estado = obtener_estado()
    if not estado.is_activa:
        return Response({'error': 'La jornada de votación está cerrada'}, status=status.HTTP_400_BAD_REQUEST)

    token = tokens.token_del_request(request)
    votante_id = tokens.votante_id_del_token(token)
    if not votante_id:
        return Response(
            {'error': 'Debes validar tu cédula en la cabina antes de votar'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    candidato_id = request.data.get('candidato_id')

    with transaction.atomic():
        # Se bloquea al votante para que dos peticiones simultáneas no registren
        # dos votos de la misma persona.
        votante = Votante.objects.select_for_update().filter(id=votante_id).first()
        if votante is None:
            return Response({'error': 'La sesión de votación expiró'}, status=status.HTTP_401_UNAUTHORIZED)

        if votante.ya_voto:
            return Response(
                {'error': 'Ya registraste un voto en esta jornada'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not votante.ingreso_registrado:
            return Response(
                {'error': 'Tu ingreso aún no ha sido validado por el administrador'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # El voto en blanco también es una opción válida del tarjetón.
        candidato = candidatos_para_votar().filter(id=candidato_id).first()
        if candidato is None:
            return Response({'error': 'Candidato no válido'}, status=status.HTTP_404_NOT_FOUND)

        # Voto secreto: no se guarda a qué votante corresponde.
        Voto.objects.create(candidato=candidato)

        votante.ya_voto = True
        votante.fecha_voto = timezone.now()
        votante.save(update_fields=['ya_voto', 'fecha_voto'])

    tokens.revocar(token)
    return Response(
        {'mensaje': 'Voto registrado exitosamente', 'candidato': candidato.nombre},
        status=status.HTTP_201_CREATED,
    )


# --------------------------------------------------------------------------- #
# Secciones restringidas y resultados
# --------------------------------------------------------------------------- #

@api_view(['GET'])
@permission_classes([EsAdministrador])
def total_votos_realtime(request):
    """Monitor en vivo: cifras de la jornada, solo para el administrador."""
    estado = obtener_estado()
    return Response({
        'total_votos': Voto.objects.count(),
        'votantes_habilitados': Votante.objects.filter(ingreso_registrado=True).count(),
        'votantes_pendientes': Votante.objects.filter(
            ingreso_registrado=True, ya_voto=False
        ).count(),
        'padron_total': Votante.objects.count(),
        **datos_estado_publico(estado),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def resultados_finales(request):
    """Resultados del escrutinio.

    El administrador los ve en cuanto cierra la jornada; los votantes solo
    después de que el administrador habilite su publicación.
    """
    estado = obtener_estado()
    es_administrador = bool(
        request.user and request.user.is_authenticated and request.user.is_staff
    )

    if not es_administrador:
        if estado.is_activa:
            return Response(
                {'error': 'La jornada de votación continúa activa'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not resultados_habilitados(estado):
            return Response(
                {'error': 'El administrador aún no ha habilitado la publicación de resultados'},
                status=status.HTTP_403_FORBIDDEN,
            )

    candidatos = candidatos_para_conteo().annotate(total_votos=Count('votos')).order_by('-total_votos')
    data = [
        {
            'id': c.id,
            'nombre': c.nombre,
            'numero_tarjeton': c.numero_tarjeton,
            'es_voto_blanco': c.es_voto_blanco,
            'votos': c.total_votos,
            'activo': c.activo,
        }
        for c in candidatos
    ]
    total = sum(item['votos'] for item in data)

    return Response({
        'resultados': data,
        'ganador': next((item for item in data if not item['es_voto_blanco']), None),
        'total_votos': total,
        **datos_estado_publico(estado),
    })


@api_view(['GET', 'PATCH'])
@permission_classes([EsAdministrador])
def configuracion_jornada(request):
    """Consulta y actualiza la configuración de la jornada (solo administrador)."""
    estado = obtener_estado()

    if request.method == 'PATCH':
        if 'hora_cierre_votacion' in request.data:
            estado.hora_cierre_votacion = request.data.get('hora_cierre_votacion') or None

        if 'resultados_publicos' in request.data:
            publicar = bool(request.data.get('resultados_publicos'))
            if publicar and estado.is_activa:
                return Response(
                    {'error': 'Primero debes cerrar la jornada para publicar los resultados'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            estado.resultados_publicos = publicar

        estado.save()

    return Response({
        'configuracion': EstadoElectoralSerializer(estado).data,
        **datos_estado_publico(estado),
    })


@api_view(['POST'])
@permission_classes([EsAdministrador])
def cerrar_jornada(request):
    """Cierra la votación y publica los resultados en una sola acción."""
    estado = obtener_estado()
    if not estado.is_activa:
        return Response({'error': 'La jornada ya estaba cerrada'}, status=status.HTTP_400_BAD_REQUEST)

    if not tope_de_votacion_alcanzado(estado) and not request.data.get('forzar'):
        return Response(
            {
                'error': (
                    'Todavía no se alcanza la hora límite de votación '
                    f"({estado.hora_cierre_votacion:%H:%M}). Espera a que termine la fila."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    estado.is_activa = False
    estado.fecha_cierre = timezone.now()
    estado.resultados_publicos = True
    estado.save(update_fields=['is_activa', 'fecha_cierre', 'resultados_publicos'])

    return Response({
        'mensaje': 'Jornada cerrada y resultados publicados',
        **datos_estado_publico(estado),
    })


@api_view(['POST'])
@permission_classes([EsAdministrador])
def reabrir_jornada(request):
    """Reactiva la votación (por ejemplo, si aún quedaba gente en la fila)."""
    estado = obtener_estado()
    estado.is_activa = True
    estado.resultados_publicos = False
    estado.fecha_cierre = None
    estado.save(update_fields=['is_activa', 'resultados_publicos', 'fecha_cierre'])
    return Response({'mensaje': 'Jornada reabierta', **datos_estado_publico(estado)})


@api_view(['GET'])
@permission_classes([EsAdministrador])
def resultados_pdf(request):
    """Descarga el acta de resultados en PDF (solo administrador).

    Está disponible en cualquier momento de la jornada, incluso antes de
    publicar los resultados a los votantes: el documento lo advierte en sus
    notas al pie.
    """
    try:
        contenido = reportes.construir_pdf_resultados()
    except Exception as error:  # noqa: BLE001 - se informa al cliente sin romper la API
        return Response(
            {'error': f'No se pudo generar el PDF de resultados: {error}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    respuesta = HttpResponse(contenido, content_type='application/pdf')
    respuesta['Content-Disposition'] = f'attachment; filename="{reportes.nombre_archivo()}"'
    respuesta['Content-Length'] = len(contenido)
    return respuesta
