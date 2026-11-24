"""Catálogo de roles y permisos del panel (fuente única de verdad)."""

ROL_ADMIN = "admin"
ROL_COLABORADOR = "colaborador"
ROL_DEMO = "demo"

ARTICULOS_VER = "articulos.ver"
ARTICULOS_CREAR = "articulos.crear"
ARTICULOS_EDITAR = "articulos.editar"
ARTICULOS_CAMBIAR_ESTADO = "articulos.cambiar_estado"
ARTICULOS_ELIMINAR = "articulos.eliminar"
VENTAS_REGISTRAR = "ventas.registrar"
CATALOGOS_AGREGAR = "catalogos.agregar"
CATALOGOS_GESTIONAR = "catalogos.gestionar"
USUARIOS_GESTIONAR = "usuarios.gestionar"
CONFIGURACION_EDITAR = "configuracion.editar"
REPORTES_VER = "reportes.ver"
HISTORIAL_VER = "historial.ver"

DESCRIPCIONES_PERMISO: dict[str, str] = {
    ARTICULOS_VER: "Ver los artículos en el panel",
    ARTICULOS_CREAR: "Crear autos y repuestos",
    ARTICULOS_EDITAR: "Editar los datos y las fotos de los artículos",
    ARTICULOS_CAMBIAR_ESTADO: "Cambiar el estado de los artículos",
    ARTICULOS_ELIMINAR: "Eliminar artículos sin ventas",
    VENTAS_REGISTRAR: "Registrar y deshacer ventas",
    CATALOGOS_AGREGAR: "Agregar marcas, modelos y categorías desde el formulario",
    CATALOGOS_GESTIONAR: "Editar y borrar los catálogos",
    USUARIOS_GESTIONAR: "Crear, editar y desactivar usuarios del sistema",
    CONFIGURACION_EDITAR: "Editar los datos del negocio",
    REPORTES_VER: "Ver los reportes",
    HISTORIAL_VER: "Ver el historial de cambios",
}

DESCRIPCIONES_ROL: dict[str, str] = {
    ROL_ADMIN: "Dueño del negocio: gestiona el catálogo, los usuarios y la configuración",
    ROL_COLABORADOR: "Crea y edita artículos y cambia estados; no borra ni gestiona usuarios",
    ROL_DEMO: "Usuario de demostración de solo lectura",
}

PERMISOS_POR_ROL: dict[str, set[str]] = {
    ROL_ADMIN: set(DESCRIPCIONES_PERMISO),
    ROL_COLABORADOR: {
        ARTICULOS_VER,
        ARTICULOS_CREAR,
        ARTICULOS_EDITAR,
        ARTICULOS_CAMBIAR_ESTADO,
        VENTAS_REGISTRAR,
        CATALOGOS_AGREGAR,
        REPORTES_VER,
        HISTORIAL_VER,
    },
    ROL_DEMO: {ARTICULOS_VER, REPORTES_VER, HISTORIAL_VER},
}
