from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/votantes/', include('apps.votantes.urls')),
    path('api/elecciones/', include('apps.elecciones.urls')),
]

# Servir archivos estáticos/media en entorno local
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)