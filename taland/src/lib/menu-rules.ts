export function menuRuleError(categoryId: string, qtyOnly: boolean, variantCount: number) {
  if (categoryId === "sushi" || categoryId === "burgers") {
    if (qtyOnly) return "У суши и бургеров нельзя убрать варианты. Допов и удаления ингредиентов нет.";
    if (variantCount !== 3) return "У суши и бургеров ровно 3 варианта.";
    return null;
  }
  if (categoryId === "grill") {
    if (qtyOnly) {
      if (variantCount !== 1) return "У гарнира, соуса или напитка одна цена и только количество.";
      return null;
    }
    if (variantCount < 2 || variantCount > 4) return "У блюда шашлыка от 2 до 4 вариантов, как в меню кухни.";
    return null;
  }
  return "Неизвестная категория";
}
