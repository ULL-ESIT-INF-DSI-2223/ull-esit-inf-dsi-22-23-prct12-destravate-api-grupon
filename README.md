# Práctica 12 - Destravate: API Node/Express

## Grupo N

### Daniel Jorge Acosta y Saúl Martín García

### alu0101239187@ull.edu.es y alu0101405180@ull.edu.es

[![Tests](https://github.com/ULL-ESIT-INF-DSI-2223/ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/ULL-ESIT-INF-DSI-2223/ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon/actions/workflows/node.js.yml)

[![Coveralls](https://github.com/ULL-ESIT-INF-DSI-2223/ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon/actions/workflows/coveralls.yml/badge.svg)](https://github.com/ULL-ESIT-INF-DSI-2223/ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon/actions/workflows/coveralls.yml)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ULL-ESIT-INF-DSI-2223_ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ULL-ESIT-INF-DSI-2223_ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon)

## Índice

- [Introducción](#introducción)
- [Práctica](#práctica)
  - [Challenge](#challenge)
  - [Group](#group)
  - [Track](#track)
  - [User](#user)
  - [Decisiones de diseño](#decisiones-de-diseño)
- [Conclusión](#conclusión)
- [Bibliografía](#bibliografía)

## Introducción

Este proyecto consiste en la creación de una API REST haciendo uso de Node/Express y de mongoose como base de datos. Dicha API tendra como objetivo llevar a cabo operaciones de creación, lectura, modificación y borrado (Create, Read, Update, Delete - CRUD) de un registro de actividades deportivas.

 El proyecto sigue la siguiente estructura de directorios:

- **dist**: Código JavaScript generado
- **docs**: Documentación del código
- **src**: Código fuente TypeScript
  - **db**: Creación y conexión con la base de datos
  - **models**: Modelos de los datos
  - **routes**: Manejadores de peticiones separadas por Modelo de Datos
  - **app.ts**: Aplicación de express
  - **index.ts**: Servidor
- **tests**: Tests del código fuente TypeScript

## Práctica

Una vez descrito el proyecto de manera general, comenzaremos abordando los modelos de datos y las relaciones entre ellos. Estas relaciones se explicarán con más detalle en el apartado de Decisiones de diseño.

### Challenge

El modelo challenge se utiliza para almacenar los datos de los retos del sistema y cuenta con los siguientes atributos:

- ID del reto. El esquema controla que sea positivo y entero.
- Nombre del reto.
- IDs de la rutas que forman parte del reto. El esquema controla que sean válidos.
- Tipo de actividad del reto. El cual solo podrá ser o Bicicleta o Correr.
- Longitud o Kilómetros totales a realizar. El esquema controla que sean positivos.
- IDs de los usuario que están realizando el reto. El esquema controla que sean válidos.

### Group

El modelo Group se utiliza para almacenar los datos de los grupos del sistema y cuenta con los siguientes atributos:

- ID del grupo. El esquema controla que sea positivo y entero.
- Nombre del grupo.
- IDs de los miembros del grupo. El esquema elimina los IDs repetidos y compruena que los ID introducidos sean válidos. 
- Estadísticas de entrenamiento totales del grupo. 
- Clasificación de los miembros del grupo. El esquema ordena los usuarios en base a sus total de kilómetros recorridos.
- IDs de las rutas favoritas del grupo. El esquema elimina los IDs repetidos y controla que sean válidos.
- Historial del grupo. El esquema controla que las fechas no sean futuras y que los IDs de las rutas del historial sean válidos.

### Track

El modelo Track se utiliza para almacenar los datos de los rutas del sistema y cuenta con los siguientes atributos:

- ID de la ruta. El esquema controla que sea positivo y entero.
- Nombre de la ruta.
- Coordenadas del inicio de la ruta. Controla que sean coordenadas válidas.
- Coordenadas del final de la ruta. Controla que sean coordenadas válidas.
- Longitug de la ruta en kilómetros. El esquema controla que sea positiva.
- Desnivel medio de la ruta. El esquema controla que sea un valor positivo.
- IDs de los usuarios que han realizado la ruta del usuario. El esquema elimina los IDs repetidos y compruena que los ID introducidos sean válidos.
- Tipo de actividad que se puede realizar en la ruta. El cual solo podrá ser o Bicicleta o Correr.
- Calificación media de la ruta. El esquema controla que este entre 0 y 10.

### User

El modelo User se utiliza para almacenar los datos de los usuarios del sistema y cuenta con los siguientes atributos:

- ID o nombre de la cuenta del usuario.
- Nombre del usuario.
- Actividad que realiza el usuario. Se puede ver una definición más detallada en el apartado _Tipo Activity_.
- IDs de los amigos del usuario. La clase elimina los IDs repetidos y controla que un usuario no sea amigo de si mismo.
- IDs de los grupos a los que pertenece el usuario. La clase elimina los IDs repetidos y controla que sean válidos.
- Estadísticas de entrenamiento del usuario. Se puede ver una definición más detallada en el apartado _Clase Statistics_.
- IDs de las rutas favoritas del usuario. La clase elimina los IDs repetidos y controla que sean válidos.
- IDs de los retos activos del usuario. La clase elimina los IDs repetidos y controla que sean válidos.
- Historial del usuario. La clase controla que las fechas no sean futuras y que los IDs de las rutas del historial sean válidos.

### Decisiones de diseño

Las decisiones de diseño más importantes que hemos tomado son las siguientes:

- En las operaciones de lectura, borrado y modificación por nombre, se realizarán estas acciones en todas las entradas que compartan el mismo nombre en lugar de hacerlo solo en la primera encontrada.

- Al crear un usuario, sus estadísticas son calculadas de forma automática por la API en base a las rutas de su historial.

- Al crear, eliminar o actualizar un usuario, se actualizará su información en la lista de amigos de sus amigos, los grupos a los que pertenezca y el historial de usuarios de las rutas de su historial.

- Al crear un grupo, sus estadísticas son calculadas de forma automática por la API en base a las rutas del historial del grupo. Además, el ranking se ordenará automáticamente en base a las longitudes totales recorridas por los usuarios pertenecientes a este.

- Al eliminar una ruta, esta se eliminará de los historiales de todos los usuarios y grupos, además de de las rutas favoritas. También se recalcularán las estadísticas de los usuarios y los grupos y el ranking de estos últimos.

- Al crear, eliminar o actualizar un grupo, se actualizará su información en la lista de grupos de todos sus participantes.

- Al crear, eliminar o actualizar un reto, la información correspondiente se actualizará en los usuarios que estaban participando en él.

- Las coordenadas de las rutas se siguen el estándar de coordenadas geográficas, donde los valores de latitud se miden respecto al ecuador y varían desde -90° en el polo sur hasta +90° en el polo norte. Los valores de longitud se miden respecto al meridiano base y van desde -180° en el oeste hasta 180° en el este. Estas coordenadas se guardan en duplas, en el formato [latitud, longitud].

- Para el historial de usuarios y grupos, se utilizan duplas que contienen la fecha (de la clase Date) y una referencia al track correspondiente en la base de datos.

## Conclusión

Esta práctica ha sido un acercamiento más próximo a la creación de un programa real que las que hemos venido haciendo hasta ahora. Su complejidad era mucho mayor, debido al gran número de variables e interconexiones a tener en cuenta, la cantidad de trabajo a realizar y el uso de herramientas asíncronas. Con este proyecto podemos darnos cuenta de la gran utilidad de los gestores de bases de datos, que permiten controlar las relaciones entre entidades de una forma mucho más fiable y sencilla que mediante el código elaborado durante el proyecto.

Además, el desarrollo de la API para llevar a cabo peticiones a dicha base de datos ha sido desafiante debido a las relaciones que existen entre los propios datos y a la complejidad de estas.

## Bibliografía

- [Desarrollo de Sistemas Informáticos - Práctica 12 - Destravate: API Node/Express](https://ull-esit-inf-dsi-2223.github.io/prct12-destravate-api/)
- [Desarrollo de Sistemas Informáticos - Node.js](https://ull-esit-inf-dsi-2223.github.io/nodejs-theory/)
- [MongoDB Atlas](https://www.mongodb.com/es/cloud/atlas/efficiency)
- [Cyclic](https://www.cyclic.sh)