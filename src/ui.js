export function byId(id) {
  return document.getElementById(id);
}

export function setVisible(element, visible) {
  element.classList.toggle("hidden", !visible);
}

export function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

export function renderCarGrid(container, cars, selectedCarId, language, translate, onSelect) {
  container.innerHTML = "";
  for (const car of cars) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "carCard" + (car.id === selectedCarId ? " active" : "");
    button.innerHTML = `
      <span class="carSwatch" style="background:${car.body};"></span>
      <span class="carCardTitle">${translate(language, car.nameKey)}</span>
      <span class="carCardDesc">${car.description[language] || car.description.en}</span>
    `;
    button.addEventListener("click", () => onSelect(car.id));
    container.appendChild(button);
  }
}

export function setupHoldButton(button, onStart, onEnd) {
  const begin = (event) => {
    event.preventDefault();
    onStart();
  };
  const finish = (event) => {
    event.preventDefault();
    onEnd();
  };
  button.addEventListener("pointerdown", begin);
  button.addEventListener("pointerup", finish);
  button.addEventListener("pointercancel", finish);
  button.addEventListener("pointerleave", finish);
}
