const form = document.getElementById("form-prod");
const tabla = document.getElementById("tabla-prod");
const total = document.getElementById("ganancia-total");

const costoInput = document.getElementById("costo");
const precioInput = document.getElementById("precio");

const imagenInput = document.getElementById("imagen");
const ingredientesInput = document.getElementById("ingredientes");

const gananciaInput = document.getElementById("ganancia-deseada");

let gananciaTotal = 0;


function leerImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
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

form.addEventListener("submit", (e) => {
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

  const fila = document.createElement("tr");
  fila.innerHTML = `
  <td>${nombre}</td>
  <td>$UYU${costo.toFixed(2)}</td>
  <td>$UYU${precioFinal.toFixed(2)}</td>
  <td>$UYU${ganancia.toFixed(2)}</td>
  <td>${porcentaje.toFixed(1)}%</td>
  `;
  tabla.appendChild(fila);

  gananciaTotal += ganancia;
  total.textContent = gananciaTotal.toFixed(2);

  form.reset();
  precioInput.disabled = false;
  gananciaInput.disabled = false;
});
