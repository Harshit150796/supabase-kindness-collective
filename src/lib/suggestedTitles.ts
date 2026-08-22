export const getSuggestedTitles = (category: string): string[] => {
  switch (category) {
    case "food":
      return [
        "Help Feed My Family This Month",
        "Groceries for Those in Need",
        "Supporting Families with Food Coupons",
      ];
    case "healthcare":
      return [
        "Help Cover My Medical Expenses",
        "Healthcare Support Needed",
        "Medical Assistance Request",
      ];
    case "education":
      return [
        "School Supplies for My Children",
        "Education Support Needed",
        "Help with Learning Materials",
      ];
    case "clothing":
      return [
        "Help with Clothing Essentials",
        "Clothing Support for My Family",
        "Everyday Clothing Assistance",
      ];
    case "transportation":
      return [
        "Help Me Get to Work and School",
        "Transportation Support Request",
        "Assistance with Travel Essentials",
      ];
    case "utilities":
      return [
        "Help with Essential Home Needs",
        "Utilities Support Request",
        "Assistance for My Family's Home",
      ];
    default:
      return [
        "Help My Family with Essential Needs",
        "Support for Daily Necessities",
        "Coupon Assistance Request",
      ];
  }
};
