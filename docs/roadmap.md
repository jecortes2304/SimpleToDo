# Hoja de ruta de producto

Esta hoja de ruta describe trabajo futuro; no constituye funcionalidades ya
disponibles ni una promesa de fechas. Cada bloque deberá implementarse en su
propia rama, con una propuesta técnica y criterios de aceptación antes de
empezar.

## 1. Refactorización y base de producto

- Revisar y simplificar la estructura del frontend y backend conforme crezca el
  producto, manteniendo límites claros entre dominio, API, interfaz y clientes.
- Mejorar el despliegue: configuración reproducible, actualizaciones con
  rollback, observabilidad, copias de seguridad y una guía operativa corta.
- Definir una estrategia de aplicaciones cliente y una página de descargas para
  extensiones web, escritorio y móvil, con versiones, compatibilidad e
  instrucciones de instalación.

## 2. Acceso e identidades

- Añadir proveedores de acceso adicionales, empezando por GitHub OAuth.
- Mantener las mismas garantías de Google: identidad única por proveedor,
  verificación del correo de SimpleTodo, enlaces de verificación y limpieza de
  cuentas no verificadas.
- Diseñar la vinculación y desvinculación de proveedores desde el perfil sin
  permitir perder el único método de acceso válido.

## 3. Gestión de tareas y proyectos

- Adjuntar imágenes y otros archivos a tareas, con almacenamiento separado,
  límites de tamaño, permisos, vista previa y borrado seguro.
- Añadir fechas de inicio, vencimiento y recordatorios, con notificaciones por
  aplicación y, cuando proceda, correo o notificaciones push.
- Crear catálogos de estados por proyecto: cada proyecto podrá elegir su flujo
  de trabajo, columnas y reglas, sin romper las tareas existentes.

## 4. Productividad personal

- Incorporar un modo Pomodoro vinculado a una tarea, con sesiones, pausas,
  historial básico y notificaciones locales.
- Decidir después si las métricas de concentración deben ser privadas, de
  proyecto o compartidas por equipo.

## 5. Asistencia con IA

- Añadir búsqueda semántica basada en RAG para localizar tareas, proyectos y
  documentación a la que el usuario ya tenga acceso.
- Incorporar un agente que pueda realizar acciones dentro de la aplicación,
  siempre con confirmación explícita para cambios, permisos por usuario y un
  registro auditable de cada operación.
- Establecer antes la política de proveedores, coste, retención de datos y
  protección de contenido sensible.

## Orden recomendado

1. Refactorización, despliegue y fundamentos de clientes.
2. Fechas, recordatorios, estados configurables y adjuntos.
3. Página de descargas y primeros clientes complementarios.
4. GitHub OAuth y mejoras de identidad.
5. Pomodoro.
6. RAG y agente, una vez existan permisos, auditoría y datos suficientemente
   estructurados.
