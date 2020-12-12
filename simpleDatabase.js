const mysql = require('mysql');
const async = require('async');

var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'n0m3l0',
    database: 'SimpleDB'
});

function executeQuery(query, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            callback(err, null);
        } else if (connection) {
            connection.query(query, function (err, rows, fields) {
                connection.release();
                if (err) {
                    console.log(err);
                    callback(err, null);
                } else {
                    callback(null, rows);
                }
            });
        } else {
            callback(true, "No Connection");
        }
    });
}

function executeQueryParams(query, params, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            callback(err, null);
        } else if (connection) {
            connection.query(query, params, function (err, rows, fields) {
                connection.release();
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, rows);
                }
            });
        } else {
            callback(true, "No Connection");
        }
    });
}

function createData(data, callback) {
    table = data.table;
    switch (table) {
        case 'producto':
            nombre = data.create.nombre;
            cantidad = data.create.cantidad;
            precio = data.create.precio;
            colors = data.create.colors;
            if (nombre && cantidad && precio && colors) {
                if (cantidad >= 0 && precio > 0 && colors.length != 0) {
                    createProducto(nombre, cantidad, precio, colors, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
            break;
        case 'color':
            nombre = data.create.nombre;
            r = data.create.r;
            g = data.create.g;
            b = data.create.b;
            if (nombre && r && g && b) {
                if (r <= 255 && r >= 0 && g <= 255 && g >= 0 && b <= 255 && b >= 0) {
                    createColor(nombre, r, g, b, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
            break;
        default:
            break;
    }
}

function updateData(data, callback) {
    console.log('updateData');
    table = data.table;
    switch (table) {
        case 'producto':
            id = data.id;
            nombre = data.update.nombre;
            cantidad = data.update.cantidad;
            precio = data.update.precio;
            colors = data.update.colors;
            if (id && nombre && cantidad && precio && colors) {
                if (cantidad >= 0 && precio > 0 && colors.length != 0) {
                    console.log('double yws');
                    console.log(colors);
                    console.log(colors.length);
                    updateProducto(id, nombre, cantidad, precio, colors, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
            break;
        case 'color':
            id = data.id;
            nombre = data.update.nombre;
            r = data.update.r;
            g = data.update.g;
            b = data.update.b;
            if (id && nombre && r && g && b) {
                if (r <= 255 && r >= 0 && g <= 255 && g >= 0 && b <= 255 && b >= 0) {
                    updateColor(id, nombre, r, g, b, callback);
                } else {
                    callback();
                }
            } else {
                callback();
            }
            break;
        default:
            break;
    }
}

function updateProducto(id, nombre, cantidad, precio, colors, callback) {
    console.log('updateProducto');
    colors = (function (colors) { return colors.filter((v, i) => colors.indexOf(v) === i) })(colors);
    console.log('colors' + colors);
    executeQueryParams(
        'UPDATE `MProducto` SET \
            `MProducto`.`nom_prd` = ?, \
            `MProducto`.`cnt_prd` = ?, \
            `MProducto`.`prc_prd` = ? \
        WHERE `MProducto`.`id_prd` = ?;',
        [nombre, cantidad, precio, id],
        function (err, result) {
            if (err) console.log(err);
            console.log('Query 1 extioso');
            executeQueryParams(
                'SELECT \
                    `MColor`.`id_col` AS `id`\
                FROM\
                    `MColor`, `MProducto`, `EColorProducto`\
                WHERE\
                    `MProducto`.`id_prd` = `EColorProducto`.`id_prd` AND\
                    `MColor`.`id_col` = `EColorProducto`.`id_col` AND\
                    `MProducto`.`id_prd` = ?;',
                [id],
                function (err, rows) {
                    if (err) console.log(err);
                    console.log('Query 2 extioso');
                    recentColorIds = [];
                    rows.forEach(colorResult => {
                        console.log('Color: ' + colorResult.id);
                        recentColorIds.push(colorResult.id);
                    });
                    async.eachSeries(colors, function (color, callbackAsync1) {
                        console.log('eachSeries' + color);
                        if (recentColorIds.includes(color)) {
                            console.log('Ya tiene el color');
                            index = recentColorIds.indexOf(color);
                            recentColorIds.splice(index, 1);
                            callbackAsync1();
                        } else {
                            console.log('No hay color');
                            executeQueryParams(
                                'INSERT INTO `EColorProducto` (`id_prd`, `id_col`) \
                                VALUES (?, ?);',
                                [id, color],
                                function () {
                                    callbackAsync1();
                                }
                            );
                        }
                    }, function () {
                        if (recentColorIds.lenght != 0) {
                            async.eachSeries(recentColorIds, function (colorId, callbackAsync2) {
                                executeQueryParams(
                                    'DELETE FROM `EColorProducto` WHERE `EColorProducto`.`id_col` = ? AND `EColorProducto`.`id_prd` = ?',
                                    [colorId, id],
                                    function (err, result) {
                                        if (err) console.log(err);
                                        callbackAsync2();
                                    }
                                );
                            }, callback);
                        } else {
                            callback();
                        }
                    });
                }
            );
        }
    );
}

function updateColor(id, nombre, r, g, b, callback) {
    executeQueryParams(
        'UPDATE `MColor` SET \
            `MColor`.`nom_col` = ?, \
            `MColor`.`red_col` = ?, \
            `MColor`.`grn_col` = ?, \
            `MColor`.`blu_col` = ? \
        WHERE `MColor`.`id_col` = ?;',
        [nombre, r, g, b, id],
        function (err, result) {
            if (err) console.log(err);
            callback();
        }
    );
}

function createProducto(nombre, cantidad, precio, colors, callback) {
    executeQueryParams(
        'INSERT INTO `MProducto` (`nom_prd`, `cnt_prd`,`prc_prd`) \
        VALUES (?, ?, ?);',
        [nombre, cantidad, precio],
        function (err, result) {
            if (err) console.log(err);
            else console.log(result);
            id = result.insertId;
            console.log(id);
            async.eachSeries(colors, function (color, callbackAsync1) {
                executeQueryParams(
                    'INSERT INTO `EColorProducto` (`id_prd`, `id_col`) \
                    VALUES (?, ?);',
                    [id, color],
                    function (err, result) {
                        if (err) console.log(err);
                        else console.log(result);
                        callbackAsync1();
                    }
                );
            }, function () {
                callback();
            })
        }
    );
}

function createColor(nombre, r, g, b, callback) {
    console.log('creati¡iiiiing');
    executeQueryParams(
        'INSERT INTO `MColor` (`nom_col`, `red_col`, `grn_col`, `blu_col`)\
        VALUES (?, ?, ?, ?);',
        [nombre, r, g, b],
        function (err, result) {
            if (err) console.log(err);
            callback();
        }
    );
}

function getColors(product, callback) {
    executeQueryParams(
        "SELECT \
            `SimpleDB`.`MColor`.`nom_col` AS `nombre`, \
            `SimpleDB`.`MColor`.`id_col` AS `id`, \
            `MColor`.`red_col` AS `r`, \
            `MColor`.`grn_col` AS `g`, \
            `MColor`.`blu_col` AS `b`, \
            CONCAT('(',`MColor`.`red_col`, ',', `MColor`.`grn_col`, ',', `MColor`.`blu_col`, ')') AS `RGB` \
        FROM \
            `SimpleDB`.`MProducto`, `SimpleDB`.`MColor`, `SimpleDB`.`EColorProducto` \
        WHERE \
            `SimpleDB`.`MProducto`.`id_prd` = `SimpleDB`.`EColorProducto`.`id_prd` AND \
            `SimpleDB`.`MColor`.`id_col` = `SimpleDB`.`EColorProducto`.`id_col` AND \
            `SimpleDB`.`MProducto`.`nom_prd` = ?;",
        [product],
        function (err1, rows1) {
            if (err1) throw err1;
            colors = []
            rows1.forEach(element1 => {
                colors.push({
                    id: element1.id,
                    rgb: element1.RGB,
                    nombre: element1.nombre,
                    r: element1.r,
                    g: element1.g,
                    b: element1.b
                });
            });
            callback(colors);
        }
    );
}

function getUpdatedData(callback) {
    executeQuery(
        'SELECT\n \
            `SimpleDB`.`MProducto`.`id_prd` as `id`, \
            `SimpleDB`.`MProducto`.`nom_prd` as `nombre`, \
            `SimpleDB`.`MProducto`.`cnt_prd` as `cantidad`, \
            `SimpleDB`.`MProducto`.`prc_prd` as `precio` \
        FROM \
            `SimpleDB`.`MProducto`;',

        function (err, rows) {
            productos = [];
            if (err) throw err;
            async.eachSeries(rows, function (element, callback1) {
                data1 = {}
                data1['id'] = element.id;
                data1['producto'] = element.nombre;
                data1['cantidad'] = element.cantidad;
                data1['precio'] = element.precio;
                getColors(element.nombre, function (colors) {
                    data1['colors'] = colors;
                    productos.push(data1);
                    callback1();
                });
            }, function () {
                executeQuery(
                    "SELECT \
                        `MColor`.`id_col` AS `id`, \
                        `MColor`.`nom_col` AS `nombre`, \
                        `MColor`.`red_col` AS `r`, \
                        `MColor`.`grn_col` AS `g`, \
                        `MColor`.`blu_col` AS `b`, \
                        CONCAT('(',`MColor`.`red_col`, ',', `MColor`.`grn_col`, ',', `MColor`.`blu_col`, ')') as `RGB` \
                    FROM `MColor`;",
                    function (err, rows) {
                        colors = []
                        rows.forEach(color => {
                            colors.push({
                                id: color.id,
                                nombre: color.nombre,
                                r: color.r,
                                g: color.g,
                                b: color.b,
                                rgb: color.RGB
                            });
                        });
                        callback({
                            Productos: productos,
                            Colores: colors
                        }); //VERY IMPORTAAAAAN ITS THE RETUUURN
                    }
                )
            });
        }
    );
}

function deleteData(data, callback) {
    type = data.type;
    id = data.id
    switch (type) {
        case 'color':
            executeQueryParams(
                'DELETE FROM `MColor` WHERE `MColor`.`id_col` = ?',
                [id],
                callback
            );
            break;
        case 'product':
            console.log('product');
            executeQueryParams(
                'DELETE FROM `MProducto` WHERE `MProducto`.`id_prd` = ?',
                [id],
                callback
            );
            break;
        default:
            console.log('Nop');
            break;
    }
}

module.exports.deleteData = deleteData;
module.exports.updateData = updateData;
module.exports.createData = createData;
module.exports.getUpdatedData = getUpdatedData;