var socket = io.connect('http://localhost:25565', { 'forceNew': true });

var recentData = undefined;
var deleteData = undefined;
var editingId = undefined;
var currentMode = undefined;

socket.on('dbUpdate', function (data) {
    recentData = data;
    render();
});

var modalColor = document.getElementById('changeColor');
modalColor.addEventListener('show.bs.modal', function (event) {
    let button = event.relatedTarget;

    editingId = button.getAttribute('data-bs-id');
    var nombre = button.getAttribute('data-bs-name');
    var r = button.getAttribute('data-bs-red');
    var g = button.getAttribute('data-bs-green');
    var b = button.getAttribute('data-bs-blue');

    var nombrespace = modalColor.querySelector('#inputcname');
    var rspace = modalColor.querySelector('#inputr');
    var gspace = modalColor.querySelector('#inputg');
    var bspace = modalColor.querySelector('#inputb');

    nombrespace.value = nombre;
    rspace.value = r;
    gspace.value = g;
    bspace.value = b;
});

var modalProduct = document.getElementById('changeProduct');
modalProduct.addEventListener('show.bs.modal', function (event) {
    let button = event.relatedTarget;

    editingId = button.getAttribute('data-bs-id');
    var product = button.getAttribute('data-bs-producto');
    var cantidad = button.getAttribute('data-bs-cantidad');
    var precio = button.getAttribute('data-bs-precio');

    var productspace = modalProduct.querySelector('#inputpname');
    var cantidadspace = modalProduct.querySelector('#inputcantidad');
    var preciospace = modalProduct.querySelector('#inputprecio');

    productspace.value = product;
    cantidadspace.value = cantidad;
    preciospace.value = precio;

    productObj = undefined;
    for (let index = 0; index < recentData.Productos.length; index++) {
        const producto1 = recentData.Productos[index];
        if (producto1.producto == product) {
            productObj = producto1;
            break;
        }
    }

    test = function (productColor, color) {
        return productColor.id == color.id ? 'checked' : '';
    }

    html = recentData.Colores.map(color => `
                            <div class="form-check">
                                <label class="form-check-label" for="col${String(color.id) + color.nombre}">${color.nombre}</label>
                                <input class="form-check-input" type="checkbox" value="${color.nombre}" id="col${String(color.id) + color.nombre}" ${typeof productObj === "undefined"? '' : productObj.colors.map(productColor => test(productColor, color)).join('')}>
                            </div>`).join('\n');
    document.getElementById('colorSelection').innerHTML = html;
});

function delData(id, type) {
    deleteData = { id: id, type: type }
}

function upOCData(mode) {
    if (mode != currentMode) {
        switch (mode) {
            case 'cColor':
                document.getElementById('submitColor').onclick = creationColor;
                break;
            case 'eColor':
                document.getElementById('submitColor').onclick = updationColor;
                break;
            case 'cProduct':
                document.getElementById('submitProduct').onclick = creationProduct;
                break;
            case 'eProduct':
                document.getElementById('submitProduct').onclick = updationProduct;
                break;
            default:
                break;
        }
    }
}

function creationColor() {
    table = 'color';
    name = document.getElementById('inputcname').value;
    r = document.getElementById('inputr').value;
    g = document.getElementById('inputg').value;
    b = document.getElementById('inputb').value;
    socket.emit('create', { table: table, id: Number(editingId), create: { nombre: name, r: r, g: g, b: b } });
}

function creationProduct(){
    table = 'producto';

    name = document.getElementById('inputpname').value;
    cantidad = document.getElementById('inputcantidad').value;
    precio = document.getElementById('inputprecio').value;

    colors = [];
    recentData.Colores.forEach(color => {
        id = `col${String(color.id) + color.nombre}`;
        if (document.getElementById(id).checked) colors.push(color.id);
    });
    socket.emit('create', { table: table, id: Number(editingId), create: { nombre: name, cantidad: cantidad, precio: precio, colors: colors } });
}

function deletion() {
    socket.emit('delete', deleteData);
}

function updationColor() {
    table = 'color';
    name = document.getElementById('inputcname').value;
    r = document.getElementById('inputr').value;
    g = document.getElementById('inputg').value;
    b = document.getElementById('inputb').value;
    socket.emit('update', { table: table, id: Number(editingId), update: { nombre: name, r: r, g: g, b: b } });
}

function updationProduct() {
    table = 'producto';

    name = document.getElementById('inputpname').value;
    cantidad = document.getElementById('inputcantidad').value;
    precio = document.getElementById('inputprecio').value;

    colors = [];
    recentData.Colores.forEach(color => {
        id = `col${String(color.id) + color.nombre}`;
        if (document.getElementById(id).checked) colors.push(color.id);
    });
    socket.emit('update', { table: table, id: Number(editingId), update: { nombre: name, cantidad: cantidad, precio: precio, colors: colors } });
}

render = function () {
    data = recentData;
    //Colors
    html = data.Colores.map(color => `
                <div class="row">
                    <div class="col-sm"><h6>${color.nombre}</h6></div>
                    <div class="col-sm"><h6>${color.rgb}</h6></div>
                    <div class="col-sm"><div class="color" style="background-color: rgb${color.rgb};"></div></div>
                    <div class="col-sm">
                        <button onclick="upOCData('eColor')" data-bs-id="${color.id}" data-bs-name="${color.nombre}" data-bs-red="${color.r}" data-bs-green="${color.g}" data-bs-blue="${color.b}" type="button" class="btn btn-primary mx-auto" data-bs-toggle="modal" data-bs-target="#changeColor">
                            Modificar
                        </button>
                    </div>
                    <div class="col-sm">
                        <button onclick="delData(${color.id}, 'color')" type="button" class="btn btn-danger mx-auto" data-bs-toggle="modal" data-bs-target="#deleteConfirmationModal">
                            Eliminar
                        </button>
                    </div>
                </div>`).join("\n");
    document.getElementById("colors").innerHTML = html;

    html = data.Productos.map(producto => `
                <div class="row">
                    <div class="col-sm"><h6>${producto.producto}</h6></div>
                    <div class="col-sm"><h6>${producto.cantidad}</h6></div>
                    <div class="col-sm"><h6>${producto.precio}</h6></div>
                    <div class="col-4">
                        ${producto.colors.map(color => `<div class="color" style="background-color: rgb${color.rgb};">
                            <span style="color: ${(Number(color.r) + (1.7 * Number(color.g)) + Number(color.b))/3 > 128? 'black' : 'white'}">${color.nombre}</span>
                        </div>`).join('\n')}</div>
                    <div class="col-sm">
                        <button onclick="upOCData('eProduct')" data-bs-id="${producto.id}" data-bs-producto="${producto.producto}" data-bs-cantidad="${producto.cantidad}" data-bs-precio="${producto.precio}" type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#changeProduct">
                            Modificar
                        </button>
                    </div>
                    <div class="col-sm">
                        <button onclick="delData(${producto.id}, 'product')" type="button" class="btn btn-danger" data-bs-toggle="modal" data-bs-target="#deleteConfirmationModal">
                            Eliminar
                        </button>
                    </div>
                </div>`).join("\n");
    document.getElementById('products').innerHTML = html;
};

