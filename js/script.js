const form = document.getElementById("form-prod");
const tabla = document.getElementById("tabla-prod");
const total = document.getElementById("ganancia-total");

const formIng = document.getElementById("form-ing");
const tablaIng = document.getElementById("tabla-ing").querySelector("tbody");

const costoInput = document.getElementById("costo");
const precioInput = document.getElementById("precio");
const imagenInput = document.getElementById("imagen");
const gananciaInput = document.getElementById("ganancia-deseada");

let ingredientes = JSON.parse(localStorage.getItem("ingredientes")) || [];
const productos = JSON.parse(localStorage.getItem("productos")) || [];

let gananciaTotal = 0;

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

  cont.append(select, cantidadInput, costoParcial, btnBorrar);
  listaIngredientesUso.appendChild(cont);

  actualizarCostoIngredientes();
});

function actualizarCostoIngredientes() {
  let total = 0;
  const filas = listaIngredientesUso.querySelectorAll(".ingrediente-uso");

  ingredientesUsados = [];

  filas.forEach((fila) => {
    const nombreIng = fila.querySelector("select").value;
    const cantidad = parseFloat(fila.querySelector("input").value) || 0;
    const spanCosto = fila.querySelector("span");

    const ingData = ingredientes.find((i) => i.nombre === nombreIng);
    if (!ingData) {
      return;
    }

    const costoUnitario = ingData.precio / ingData.cantidad;
    const costoTotal = costoUnitario * cantidad;

    spanCosto.textContent = `$${costoTotal.toFixed(2)}`;
    total += costoTotal;

    ingredientesUsados.push({
      nombre: nombreIng,
      cantidad,
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

  if (precioInput.value !== "") {
    precioFinal = parseFloat(precioInput.value);
  } else if (gananciaInput.value !== "") {
    const porcentaje = parseFloat(gananciaInput.value);
    precioFinal = costo + (costo * porcentaje) / 100;
  } else {
    alert("Debes ingresar precio de producto o porcentaje deseado de ganancia");
    return;
  }

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
    alert("Por favor completa todos los campos del ingrediente. ");
    return;
  }

  const nuevoIng = { nombre, cantidad, unidad, precio };
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
