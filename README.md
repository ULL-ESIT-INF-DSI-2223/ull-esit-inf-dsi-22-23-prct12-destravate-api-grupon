# Práctica 12 - Destravate: API Node/Express

## Grupo N

### Daniel Jorge Acosta y Saúl Martín García

### alu0101239187@ull.edu.es y alu0101405180@ull.edu.es

## Índice

- [Introducción](https://ull-esit-inf-dsi-2223.github.io/ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon/#introducción)
- [Práctica](https://ull-esit-inf-dsi-2223.github.io/ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon/#práctica)
- [Conclusión](https://ull-esit-inf-dsi-2223.github.io/ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon/#conclusión)
- [Bibliografía](https://ull-esit-inf-dsi-2223.github.io/ull-esit-inf-dsi-22-23-prct12-destravate-api-grupon/#bibliografía)

## Introducción

Este proyecto consiste en la creación de una API REST haciendo uso de Node/Express y de mongoose como base de datos. Dicha API tendra como objetivo llevar a cabo operaciones de creación, lectura, modificación y borrado (Create, Read, Update, Delete - CRUD) de un registro de actividades deportivas.

 El proyecto sigue la siguiente estructura de directorios:

- **dist**: Código JavaScript generado
- **docs**: Documentación del código
- **src**: Código fuente TypeScript
  - **db**: Creacíon y conexión con la base de datos
  - **models**: Modelos de los datos
  - **routes**: Manejadores de peticiones separadas por Modelo de Datos
  - **app**: Aplicación de express
  - **index**: Servidor
- **tests**: Tests del código fuente TypeScript


## Práctica

Una vez descrito el proyecto de manera general, comenzaremos abordando los modelos de datos y las relaciones entre ellos. Estas relaciones se explicarán con más detalle en el apartado de Decisiones de diseño.

### Challenge

El modelo challenge se utiliza para almacenar los datos de los retos del sistema y cuenta con los siguientes atributos:

- ID del reto. El esquema controla que sea positivo y entero.
- Nombre del reto.
- IDs de la rutas que forman parte del reto. El esquema controla que sean válidos.
- Tipo de actividad del reto. El cual solo podrá ser o Bicicleta o Correr
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

Las decisiones de diseño importantes que hemos tomado son las siguientes:

- En las operaciones de lectura, borrado y modificación por nombre, se realizarán estas acciones en todas las entradas que compartan el mismo nombre en lugar de hacerlo solo en la primera encontrada.

- Al eliminar una ruta, no es posible determinar qué usuarios la tienen en favoritos desde la perspectiva de la ruta. Por lo tanto, es necesario recorrer todos los usuarios y comprobar si tienen la ruta en favoritos, eliminándola del historial en el proceso.

- Al eliminar un usuario, se eliminará de la lista de amigos de sus amigos, de todos los grupos a los que pertenezca y del historial de usuarios en las rutas de su historial.

- Al eliminar un grupo, se eliminará de la lista de grupos de todos sus participantes.

- Al eliminar una ruta, esta se eliminará de todos los históricos tanto de usuarios como de grupos, incluyendo sus estadísticas. Además, se eliminará de la lista de favoritos de todos los usuarios y se reducirá la longitud total de los retos en los que esté incluida.

- Al eliminar un reto, la información correspondiente también se eliminará de los usuarios que estaban participando en él.

- Las coordenadas de las rutas se siguen el estándar de coordenadas geográficas, donde los valores de latitud se miden respecto al ecuador y varían desde -90° en el polo sur hasta +90° en el polo norte. Los valores de longitud se miden respecto al meridiano base y van desde -180° en el oeste hasta 180° en el este. Estas coordenadas se guardan en duplas, en el formato [latitud, longitud].

- Para el histórico de usuarios y grupos, se utilizan duplas que contienen la fecha (de la clase Date) y una referencia al track correspondiente en la base de datos.

## Conclusión

## Bibliografía
