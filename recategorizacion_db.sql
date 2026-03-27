-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: recategorizacion_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `anomalias`
--

DROP TABLE IF EXISTS `anomalias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anomalias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cuenta_contrato` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instalacion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date DEFAULT NULL,
  `tipo_anomalia` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `importacion_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `anomalias_importacion_id_2fd50906_fk_resultado_importacion_id` (`importacion_id`),
  CONSTRAINT `anomalias_importacion_id_2fd50906_fk_resultado_importacion_id` FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=463735 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `instalacion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cuenta_contrato` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_dias_consumo` double NOT NULL,
  `total_consumo` double NOT NULL,
  `promedio_diario` double NOT NULL,
  `promedio_mensual` double NOT NULL,
  `tarifa_anterior` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tarifa_nueva` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `porcion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unidad_predial` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `importacion_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `clientes_importacion_id_2550a087_fk_resultado_importacion_id` (`importacion_id`),
  CONSTRAINT `clientes_importacion_id_2550a087_fk_resultado_importacion_id` FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1071991 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientes_no_aptos`
--

DROP TABLE IF EXISTS `clientes_no_aptos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes_no_aptos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cuenta_contrato` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instalacion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tarifa_referencia` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observacion` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `porcion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unidad_predial` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meses_en_ventana` double DEFAULT NULL,
  `estado_inicial` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `importacion_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `clientes_no_aptos_importacion_id_408e4a16_fk_resultado` (`importacion_id`),
  CONSTRAINT `clientes_no_aptos_importacion_id_408e4a16_fk_resultado` FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=252868 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `consumo_mensual`
--

DROP TABLE IF EXISTS `consumo_mensual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumo_mensual` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cuenta_contrato` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instalacion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `porcion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `periodo` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consumo` double NOT NULL,
  `dias` int NOT NULL,
  `tarifa` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cliente_id` bigint DEFAULT NULL,
  `importacion_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `consumo_mensual_cliente_id_e253968b_fk_clientes_id` (`cliente_id`),
  KEY `consumo_men_importa_87c2ec_idx` (`importacion_id`,`periodo`),
  KEY `consumo_men_importa_4808a9_idx` (`importacion_id`,`porcion`),
  CONSTRAINT `consumo_mensual_cliente_id_e253968b_fk_clientes_id` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `consumo_mensual_importacion_id_07f35bd0_fk_resultado` FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3466718 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_usuarios_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_usuarios_id` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resultado_importacion`
--

DROP TABLE IF EXISTS `resultado_importacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resultado_importacion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fecha_importacion` datetime(6) NOT NULL,
  `total_registros` int NOT NULL,
  `procesados` int NOT NULL,
  `recategorizados` int NOT NULL,
  `sin_cambios` int NOT NULL,
  `no_aptos` int NOT NULL,
  `anomalias` int NOT NULL,
  `usuario_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `resultado_importacion_usuario_id_b7c105bd_fk_usuarios_id` (`usuario_id`),
  CONSTRAINT `resultado_importacion_usuario_id_b7c105bd_fk_usuarios_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resumen_tarifario`
--

DROP TABLE IF EXISTS `resumen_tarifario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resumen_tarifario` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tarifa_anterior` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tarifa_nueva` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad_clientes` int NOT NULL,
  `porcentaje` double NOT NULL,
  `importacion_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `resumen_tarifario_importacion_id_3e84f963_fk_resultado` (`importacion_id`),
  CONSTRAINT `resumen_tarifario_importacion_id_3e84f963_fk_resultado` FOREIGN KEY (`importacion_id`) REFERENCES `resultado_importacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `fecha_creacion` datetime(6) NOT NULL,
  `ultimo_acceso` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios_groups`
--

DROP TABLE IF EXISTS `usuarios_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_groups_usuario_id_group_id_a66c5ef3_uniq` (`usuario_id`,`group_id`),
  KEY `usuarios_groups_group_id_18c61092_fk_auth_group_id` (`group_id`),
  CONSTRAINT `usuarios_groups_group_id_18c61092_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `usuarios_groups_usuario_id_1132ca50_fk_usuarios_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios_user_permissions`
--

DROP TABLE IF EXISTS `usuarios_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_user_permissions_usuario_id_permission_id_474b33a5_uniq` (`usuario_id`,`permission_id`),
  KEY `usuarios_user_permis_permission_id_af615ca1_fk_auth_perm` (`permission_id`),
  CONSTRAINT `usuarios_user_permis_permission_id_af615ca1_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `usuarios_user_permissions_usuario_id_232fd58d_fk_usuarios_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-26 23:45:12
