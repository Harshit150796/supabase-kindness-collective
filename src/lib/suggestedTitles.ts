export const getSuggestedTitles = (category: string): string[] => {
  switch (category) {
    case "food":
      return [
        "Help Feed My Family This Month",
        "Groceries for Those in Need",
        "Supporting Families with Food Coupons",
      ];
    case "meals":
      return [
        "Warm Meals for My Family",
        "Help Us Through a Hard Month",
        "Meals While We Get Back on Our Feet",
      ];
    case "childcare":
      return [
        "Diapers and Formula for My Baby",
        "Help With My Kids' Everyday Needs",
        "Support for a Growing Family",
      ];
    case "emergency":
      return [
        "Help Us Recover After an Emergency",
        "Starting Over After a Crisis",
        "Urgent Help With the Basics",
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
