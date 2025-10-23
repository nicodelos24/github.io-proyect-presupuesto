const form = document.getElementById("form-prod");
const tabla = document.getElementById("tabla-prod");
const total = document.getElementById("ganancia-total");

const formIng = document.getElementById("form-ing");
const tablaIng = document.getElementById("tabla-ing").querySelector("tbody");

const unidadSelect = document.getElementById("ing-unidad");
const contenidoInput = document.getElementById("ing-contenido");
const grupoPaquete = document.getElementById('grupo-paquete');




unidadSelect.addEventListener("change", () => {
  if (unidadSelect.value === "paquete") {
    grupoPaquete.style.display = "flex";
  } else {
    grupoPaquete.style.display = "none";
    contenidoInput.value = "";
  }
});

const costoInput = document.getElementById("costo");
const precioInput = document.getElementById("precio");
const imagenInput = document.getElementById("imagen");
const gananciaInput = document.getElementById("ganancia-deseada");

let ingredientes = JSON.parse(localStorage.getItem("ingredientes")) || [];
const productos = JSON.parse(localStorage.getItem("productos")) || [];

let gananciaTotal = 0;

const conversion = {
  g: {tipo: "peso", factor: 1},
  kg: {tipo: "peso", factor: 1000},
  ml: {tipo: "volumen", factor: 1 },

  cl: {tipo: "volumen", factor: 10},
  l: {tipo: "volumen", factor: 1000},

  unidad: {tipo: "unidad", factor: 1}
};


function convertirCantidad(cantidad, unidadOrigen, unidadDestino) {
  //si son iguales no hay nada que convertir
  if (unidadOrigen === unidadDestino) return cantidad; 

  const origen = conversion[unidadOrigen];
  const destino = conversion [unidadDestino];

  // si alguna cantidad no existe devolvemos la cantidad original
  if (!origen || !destino) return cantidad;

  //solo convertir si son del mismo tipo peso a peso, o volumen a volumen
  if (origen.tipo !== destino.tipo ){
    console.warn(`⚠️ No se puede convertir de ${unidadOrigen} a ${unidadDestino}`);
    return cantidad;
  }

//fórmula: cantidad * (factorOrigen / factorDestino)
return (cantidad* origen.factor) / destino.factor;
}



// esto es lo de leer la imagen y convertir a Base64 y lo guarda en localStorage
function leerImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}




function agregarIngredienteATabla(ing) {
  const fila = document.createElement("tr");
  fila.innerHTML = `
  <td>${ing.nombre}</td>
  <td>${ing.cantidad}</td>
  <td>${ing.unidad}</td>
  <td>$${ing.precio.toFixed(2)}</td>
  <td>$${(ing.precio / ing.cantidad).toFixed(2)} por ${ing.unidad}</td>
  <td><button class= "borrar-ing">🗑️</button></td>
  `;
  tablaIng.appendChild(fila);

  fila.querySelector(".borrar-ing").addEventListener("click", () => {
    ingredientes = ingredientes.filter((i) => i.nombre !== ing.nombre);
    localStorage.setItem("ingredientes", JSON.stringify(ingredientes));
    fila.remove();
  });
}




// Acá se selecciona ingresar precio o calcular según porcentaje ganancia
precioInput.addEventListener("input", () => {
  if (precioInput.value !== "") {
    gananciaInput.disabled = true;
    gananciaInput.value = "";
  } else {
    gananciaInput.disabled = false;
  }
});


gananciaInput.addEventListener("input", () => {
  if (gananciaInput.value !== "") {
    precioInput.disabled = true;
    precioInput.value = "";
  } else {
    precioInput.disabled = false;
  }
});

//acá los ingredientes disponibles
const listaIngredientesUso = document.getElementById("lista-ingredientes-uso");
const agregarIngredienteUsoBtn = document.getElementById(
  "agregar-ingrediente-uso"
);
const costoIngredientesSpan = document.getElementById("costo-ingredientes");

let ingredientesUsados = []; //ingredientes para el producto actual




agregarIngredienteUsoBtn.addEventListener("click", (e) => {
  e.preventDefault();

  if (ingredientes.length === 0) {
    alert("Primero agrega ingredientes al inventario.");
    return;
  }

  // se crea contenedor del nuevo ingrediente usado
  const cont = document.createElement("div");
  cont.classList.add("ingrediente-uso");

  //creo selector con ingredientes existentes
  const select = document.createElement("select");
  ingredientes.forEach((ing) => {
    const opt = document.createElement("option");
    opt.value = ing.nombre;
    opt.textContent = `
  ${ing.nombre} ($${(ing.precio / ing.cantidad).toFixed(2)} por ${ing.unidad})
  `;
    select.appendChild(opt);
  });

  //cantidad
  const cantidadInput = document.createElement("input");
  cantidadInput.type = "number";
  cantidadInput.placeholder = "Cantidad usada";
  cantidadInput.min = "0";

  const unidadSelect = document.createElement("select");
  unidadSelect.innerHTML = `
  <optgroup label="Peso">
    <option value="g">Gramos (g)</option>
    <option value="kg">Kilogramos (kg)</option>
  </optgroup>
  <optgroup label="Volumen">
    <option value="ml">Mililitros (ml)</option>
    <option value="cl">Centilitros (cl)</option>
    <option value="l">Litros (l)</option>
  </optgroup>
  <optgroup label="Unidades">
    <option value="unidad">Unidad</option>
    <option value="paquete">Paquete</option>
  </optgroup>
  `;

  // costo parcial
  const costoParcial = document.createElement("span");
  costoParcial.textContent = "$0.00";

  //btn eliminar
  const btnBorrar = document.createElement("button");
  btnBorrar.type = "button";
  btnBorrar.textContent = "❌";
  btnBorrar.addEventListener("click", () => {
    cont.remove();
    actualizarCostoIngredientes();
  });

  // Evento para recalcular costo cuando haya cambios
  cantidadInput.addEventListener("input", actualizarCostoIngredientes);
  select.addEventListener("change", actualizarCostoIngredientes);
  unidadSelect.addEventListener("change", actualizarCostoIngredientes);

  cont.append(select, cantidadInput, unidadSelect, costoParcial, btnBorrar);
  listaIngredientesUso.appendChild(cont);

  actualizarCostoIngredientes();
});




function actualizarCostoIngredientes() {
  let total = 0;
  const filas = listaIngredientesUso.querySelectorAll(".ingrediente-uso");

  ingredientesUsados = [];

  filas.forEach((fila) => {
    const selects = fila.querySelectorAll("select");
    const nombreIng = selects[0].value;
    const cantidadUsada = parseFloat(fila.querySelector("input").value) || 0;
    const unidadUsada = selects[1] ? selects[1].value : "g";
    const spanCosto = fila.querySelector("span");

    const ingData = ingredientes.find((i) => i.nombre === nombreIng);
    if (!ingData) {
      return;
    }

    let cantidadConvertida;

    if (ingData.unidad === "paquete") {
      //si ingrediente se guarda como paquete
      const contenidoEnBase = convertirCantidad (
        ingData.contenido,
        ingData.contenidoUnidad,
        unidadUsada
      );

      cantidadConvertida = (cantidadUsada / contenidoEnBase) * ingData.cantidad;
    } else {
      // sino se usa la conversión normal
      cantidadConvertida = convertirCantidad(
        cantidadUsada,
        unidadUsada, // la selecciona el usuario al usar ingrediente
        ingData.unidad // unidad en el inventario
      );
    }


    const costoUnitario = ingData.precio / ingData.cantidad;
    const costoTotal = costoUnitario * cantidadConvertida;

    spanCosto.textContent = `$${costoTotal.toFixed(2)}`;
    total += costoTotal;

    ingredientesUsados.push({
      nombre: nombreIng,
      cantidad: cantidadUsada,
      unidad: unidadUsada,
      costo: costoTotal,
    });
  });

  costoIngredientesSpan.textContent = total.toFixed(2);
  costoInput.value = total.toFixed(2);
}




form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const costo = parseFloat(costoInput.value);

  let precioFinal;


  //comprobar si el usuario pone un precio (campo no vacio)
  if (precioInput.value !== "") {
    precioFinal = parseFloat(precioInput.value);
  } else if (gananciaInput.value !== "") {
    const porcentaje = parseFloat(gananciaInput.value);
    precioFinal = costo + (costo * porcentaje) / 100;
  } else {
    alert("Debes ingresar precio de producto o porcentaje deseado de ganancia");
    return;
  }

  //validación extra por si parseFloat devuelve un Nan
  if (isNaN(precioFinal)) {
    alert("El precio calculado no es válido. Revisa el precio/ porcentaje.");
  return; }


  const ganancia = precioFinal - costo;
  //const ganancia = precio - costo;
  const porcentaje = ((precioFinal - costo) / costo) * 100;

  let imagen = "";
  if (imagenInput.files[0]) {
    imagen = await leerImagen(imagenInput.files[0]);
  }

  const ingredientesProd = ingredientesUsados;

  const id = productos.length ? productos[productos.length - 1].id + 1 : 1;

  const producto = {
    id,
    nombre,
    costo,
    precio: precioFinal,
    ganancia,
    porcentaje,
    imagen,
    ingredientes: ingredientesProd,
  };
  productos.push(producto);
  localStorage.setItem("productos", JSON.stringify(productos));

  agregarProductoATabla(producto);

  gananciaTotal += ganancia;
  total.textContent = gananciaTotal.toFixed(2);

  form.reset();
  precioInput.disabled = false;
  gananciaInput.disabled = false;
});



formIng.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("ing-nombre").value.trim();
  const cantidad = parseFloat(document.getElementById("ing-cantidad").value);
  const unidad = document.getElementById("ing-unidad").value.trim();
  const precio = parseFloat(document.getElementById("ing-precio").value);

  if (
    !nombre ||
    isNaN(cantidad) ||
    cantidad <= 0 ||
    isNaN(precio) ||
    precio <= 0
  ) {
    alert("Cantidad o precio no puede ser 0 ");
    return;
  }

  const contenido = parseFloat(contenidoInput.value) || 1;
  const contenidoUnidad = document.getElementById('ing-contenido-unidad').value;

  if(!nombre) {
  alert("Ingresa un nombre para el material/ingrediente");
  return;
  }

  if (isNaN(cantidad) || cantidad <= 0) {
    alert("La cantidad debe ser mayor a 0.");
    return;
  }

  if (isNaN(precio) || precio <= 0) {
    alert("El precio debe ser mayor que 0.");
    return;
  }


  const contenidoFinal = unidad === "paquete" ? contenido :1;


  const nuevoIng = { nombre, cantidad, unidad, precio, contenido: contenidoFinal };

  ingredientes.push(nuevoIng);
  localStorage.setItem("ingredientes", JSON.stringify(ingredientes));
  agregarIngredienteATabla(nuevoIng);

  formIng.reset();
});



function agregarProductoATabla(prod) {
  const fila = document.createElement("tr");
  fila.innerHTML = `
  <td>${prod.nombre}</td>
  <td>$UYU${prod.costo.toFixed(2)}</td>
  <td>$UYU${prod.precio.toFixed(2)}</td>
  <td>$UYU${prod.ganancia.toFixed(2)}</td>
  <td>${prod.porcentaje.toFixed(1)}%</td>
  <td>
  ${prod.ingredientes
    .map(
      (i) =>
        `${i.nombre} (${i.cantidad}${
          i.costo ? " - $" + i.costo.toFixed(2) : ""
        })`
    )
    .join("<br>")}
  </td>
  <td>${prod.imagen ? `<img src="${prod.imagen}" width="50">` : ""}</td>
  <td><button class="borrar-prod">🗑️</button></td>
  `;
  tabla.querySelector("tbody").appendChild(fila);

  fila.querySelector(".borrar-prod").addEventListener("click", () => {
    if (confirm(`Deseas quitar "${prod.nombre}"?`)) {
      const index = productos.findIndex((p) => p.id === prod.id);
      productos.splice(index, 1);
      localStorage.setItem("productos", JSON.stringify(productos));

      //quitar fila de la tabla
      fila.remove();
    }
  });
}

productos.forEach(agregarProductoATabla);
ingredientes.forEach(agregarIngredienteATabla);
