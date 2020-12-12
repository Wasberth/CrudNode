const express = require('express');
const bodyparser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const sd = require('./simpleDatabase');

app.use(bodyparser.json());
app.use(express.static('public'));

var data = [];

sd.getUpdatedData(function (updatedData) {
    data = updatedData;

    server.listen(25565, () => {
        console.log('Servidor escuchando en el servidor 25565');
    });

    io.on('connection', function (socket) {
        console.log('Alguien se ha conectado');
        socket.emit('dbUpdate', data);

        socket.on('create', function (cData) {
            console.log('createRecieved');
            sd.createData(cData, function () {
                sd.getUpdatedData(function (updatedData) {
                    data = updatedData;
                    io.sockets.emit('dbUpdate', updatedData);
                });
            });
        });

        socket.on('update', function (upData) {
            console.log('updateRecieved');
            sd.updateData(upData, function () {
                sd.getUpdatedData(function (updatedData) {
                    data = updatedData;
                    io.sockets.emit('dbUpdate', updatedData);
                });
            });
        });

        socket.on('delete', function (delData) {
            console.log('Delete');
            sd.deleteData(delData, function () {
                sd.getUpdatedData(function (updatedData) {
                    data = updatedData;
                    io.sockets.emit('dbUpdate', updatedData);
                });
            });
        });
    });
});
