-- ============================================================
--  CONTUGAS — Recategorización Volumétrica
--  Script de creación de base de datos
--  Ejecutar en MySQL como root o usuario con privilegios
-- ============================================================

-- 1. Crear y seleccionar la base de datos
CREATE DATABASE IF NOT EXISTS recategorizacion_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE recategorizacion_db;

-- ============================================================
--  TABLAS DE DJANGO (requeridas por el framework)
-- ============================================================

CREATE TABLE IF NOT EXISTS `django_migrations` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS `django_content_type` (
  `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  UNIQUE (`app_label`, `model`)
);

CREATE TABLE IF NOT EXISTS `auth_permission` (
  `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `content_type_id` integer NOT NULL,
  `codename` varchar(100) NOT NULL,
  UNIQUE (`content_type_id`, `codename`),
  CONSTRAINT `auth_permission_content_type_id_fk`
    FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
);

CREATE TABLE IF NOT EXISTS `auth_group` (
  `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `name` varchar(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS `auth_group_permissions` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `group_id` integer NOT NULL,
  `permission_id` integer NOT NULL,
  UNIQUE (`group_id`, `permission_id`),
  CONSTRAINT `auth_group_permissions_group_id_fk`
    FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_group_permissions_permission_id_fk`
    FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`)
);

CREATE TABLE IF NOT EXISTS `django_session` (
  `session_key` varchar(40) NOT NULL PRIMARY KEY,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS `django_admin_log` (
  `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` integer NULL,
  `user_id` bigint NOT NULL
);

-- ============================================================
--  APP: usuarios
-- ============================================================

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) NULL,
  `is_superuser` bool NOT NULL DEFAULT 0,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(254) NOT NULL UNIQUE,
  `rol` varchar(10) NOT NULL DEFAULT 'usuario',
  `activo` bool NOT NULL DEFAULT 1,
  `is_staff` bool NOT NULL DEFAULT 0,
  `fecha_creacion` datetime(6) NOT NULL,
  `ultimo_acceso` datetime(6) NULL
);

CREATE TABLE IF NOT EXISTS `usuarios_groups` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `usuario_id` bigint NOT NULL,
  `group_id` integer NOT NULL,
  UNIQUE (`usuario_id`, `group_id`),
  CONSTRAINT `usuarios_groups_usuario_id_fk`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `usuarios_groups_group_id_fk`
    FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
);

CREATE TABLE IF NOT EXISTS `usuarios_user_permissions` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `usuario_id` bigint NOT NULL,
  `permission_id` integer NOT NULL,
  UNIQUE (`usuario_id`, `permission_id`),
  CONSTRAINT `usuarios_user_permissions_usuario_id_fk`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `usuarios_user_permissions_permission_id_fk`
    FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`)
);

-- ============================================================
--  APP: operaciones
-- ============================================================

CREATE TABLE IF NOT EXISTS `resultado_importacion` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `fecha_importacion` datetime(6) NOT NULL,
  `total_registros` integer NOT NULL DEFAULT 0,
  `procesados` integer NOT NULL DEFAULT 0,
  `recategorizados` integer NOT NULL DEFAULT 0,
  `sin_cambios` integer NOT NULL DEFAULT 0,
  `no_aptos` integer NOT NULL DEFAULT 0,
  `anomalias` integer NOT NULL DEFAULT 0,
  `usuario_id` bigint NULL,
  CONSTRAINT `resultado_importacion_usuario_id_fk`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
);

CREATE TABLE IF NOT EXISTS `clientes` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `instalacion` varchar(50) NOT NULL,
  `cuenta_contrato` varchar(50) NOT NULL,
  `total_dias_consumo` double precision NOT NULL DEFAULT 0,
  `total_consumo` double precision NOT NULL DEFAULT 0,
  `promedio_diario` double precision NOT NULL DEFAULT 0,
  `promedio_mensual` double precision NOT NULL DEFAULT 0,
  `tarifa_anterior` varchar(20) NOT NULL,
  `tarifa_nueva` varchar(20) NOT NULL,
  `estado` varchar(20) NOT NULL,
  `porcion` varchar(50) NULL,
  `unidad_predial` varchar(50) NULL,
  `importacion_id` bigint NOT NULL,
  CONSTRAINT `clientes_importacion_id_fk`
    FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
);

CREATE TABLE IF NOT EXISTS `clientes_no_aptos` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `cuenta_contrato` varchar(50) NOT NULL,
  `instalacion` varchar(50) NOT NULL,
  `tarifa_referencia` varchar(20) NULL,
  `observacion` longtext NOT NULL,
  `porcion` varchar(50) NULL,
  `unidad_predial` varchar(50) NULL,
  `meses_en_ventana` double precision NULL,
  `estado_inicial` varchar(50) NULL,
  `importacion_id` bigint NOT NULL,
  CONSTRAINT `clientes_no_aptos_importacion_id_fk`
    FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
);

CREATE TABLE IF NOT EXISTS `anomalias` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `cuenta_contrato` varchar(50) NOT NULL,
  `instalacion` varchar(50) NOT NULL,
  `fecha` date NULL,
  `tipo_anomalia` longtext NOT NULL,
  `importacion_id` bigint NOT NULL,
  CONSTRAINT `anomalias_importacion_id_fk`
    FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
);

CREATE TABLE IF NOT EXISTS `resumen_tarifario` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `tarifa_anterior` varchar(20) NOT NULL,
  `tarifa_nueva` varchar(20) NOT NULL,
  `cantidad_clientes` integer NOT NULL DEFAULT 0,
  `porcentaje` double precision NOT NULL DEFAULT 0,
  `importacion_id` bigint NOT NULL,
  CONSTRAINT `resumen_tarifario_importacion_id_fk`
    FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
);

CREATE TABLE IF NOT EXISTS `consumo_mensual` (
  `id` bigint AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `cuenta_contrato` varchar(50) NOT NULL,
  `instalacion` varchar(50) NOT NULL,
  `porcion` varchar(50) NULL,
  `periodo` varchar(7) NOT NULL,
  `consumo` double precision NOT NULL DEFAULT 0,
  `dias` integer NOT NULL DEFAULT 0,
  `tarifa` varchar(20) NULL,
  `cliente_id` bigint NULL,
  `importacion_id` bigint NOT NULL,
  CONSTRAINT `consumo_mensual_cliente_id_fk`
    FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `consumo_mensual_importacion_id_fk`
    FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
);

CREATE INDEX `consumo_men_importa_87c2ec_idx` ON `consumo_mensual` (`importacion_id`, `periodo`);
CREATE INDEX `consumo_men_importa_4808a9_idx` ON `consumo_mensual` (`importacion_id`, `porcion`);

-- ============================================================
--  USUARIO ADMINISTRADOR POR DEFECTO
--  Contraseña: admin123  (cambiar en producción)
-- ============================================================

INSERT INTO `usuarios`
  (`password`, `last_login`, `is_superuser`, `nombre`, `apellido`, `email`, `rol`, `activo`, `is_staff`, `fecha_creacion`, `ultimo_acceso`)
VALUES
  ('pbkdf2_sha256$870000$default$hashedpassword', NULL, 1, 'Admin', 'Contugas', 'admin@contugas.com', 'admin', 1, 1, NOW(), NULL);

-- ============================================================
--  NOTA: después de importar este .sql ejecutar:
--
--  python manage.py migrate --fake-initial
--  python manage.py createsuperuser
--
-- ============================================================