// Єдина точка перемикання продуктової сцени (ProductStage): бренд і тема — лише атрибути .xstage.
// Значення резолвить згенерований scoped-CSS; тут немає ні токенів, ні кольорів.
export function setStage(stage: HTMLElement, brand: string, theme: string) {
  stage.dataset.brand = brand;
  stage.dataset.theme = theme;
}
