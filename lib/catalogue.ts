export type CatalogueGroup = "food" | "drinks";

export type CatalogueProduct = {
  name: string;
  price: number;
};

export type CatalogueCategory = {
  name: string;
  group: CatalogueGroup;
  description: string;
  products: CatalogueProduct[];
  indicativeFrom: number;
  vegetarianFriendly?: boolean;
};

const pricedProducts = (names: string[], startingPrice: number): CatalogueProduct[] => names.map((name, index) => ({
  name,
  price: startingPrice + Math.floor(index / 4) * Math.max(20, Math.round(startingPrice * 0.08)),
}));

const thaiStarters = ["Chicken Satay", "Pork Satay", "Shrimp Cakes", "Thai Fish Cakes", "Spring Rolls", "Fried Tofu", "Fried Chicken Wings", "Crispy Shrimp", "Thai Fresh Rolls", "Som Tam", "Larb", "Thai Beef Salad", "Spicy Seafood Salad", "Glass Noodle Salad"];
const thaiSoups = ["Tom Yum Goong", "Tom Yum Chicken", "Tom Yum Seafood", "Tom Kha Gai", "Tom Kha Seafood", "Clear Vegetable Soup", "Clear Pork Soup", "Spicy Beef Soup", "Thai Hot & Sour Soup"];
const thaiCurries = ["Green Curry Chicken", "Green Curry Beef", "Green Curry Pork", "Green Curry Seafood", "Red Curry Chicken", "Red Curry Beef", "Red Curry Pork", "Red Curry Duck", "Massaman Chicken", "Massaman Beef", "Panang Chicken", "Panang Beef", "Yellow Curry Chicken", "Thai Jungle Curry", "Pumpkin Curry"];
const thaiRice = ["Pad Kra Pao Chicken", "Pad Kra Pao Pork", "Pad Kra Pao Beef", "Pad Kra Pao Seafood", "Pad Kra Pao Crispy Pork", "Thai Fried Rice", "Chicken Fried Rice", "Pork Fried Rice", "Beef Fried Rice", "Seafood Fried Rice", "Pineapple Fried Rice", "Crab Fried Rice", "Garlic Rice", "Coconut Rice", "Steamed Jasmine Rice"];
const thaiNoodles = ["Pad Thai Chicken", "Pad Thai Shrimp", "Pad Thai Seafood", "Pad See Ew Chicken", "Pad See Ew Pork", "Pad See Ew Beef", "Pad Kee Mao", "Thai Boat Noodles", "Beef Noodle Soup", "Chicken Noodle Soup", "Drunken Noodles", "Glass Noodles", "Stir-Fried Egg Noodles"];
const thaiSeafood = ["Grilled Prawns", "Garlic Prawns", "Chili Prawns", "Steamed Fish with Lime", "Fried Fish with Chili", "Grilled Sea Bass", "Grilled Squid", "Garlic Squid", "Seafood Hot Pot", "Seafood Platter", "Crab Curry", "Stir-Fried Crab", "Thai Seafood BBQ"];
const thaiMeat = ["Thai BBQ Chicken", "Grilled Pork Neck", "Thai BBQ Pork", "Crispy Pork Belly", "Garlic Pork", "Chili Pork", "Thai Beef BBQ", "Grilled Beef", "Beef Basil", "Beef with Oyster Sauce", "Thai-Style Beef Steak"];
const western = ["Classic Beef Burger", "Double Beef Burger", "Cheese Burger", "BBQ Burger", "Chicken Burger", "Crispy Chicken Burger", "Spicy Chicken Burger", "Premium Beef Burger", "VIP Wagyu Burger", "Margherita Pizza", "Pepperoni Pizza", "Hawaiian Pizza", "Chicken BBQ Pizza", "Seafood Pizza", "Four Cheese Pizza", "Truffle Mushroom Pizza", "Premium Seafood Pizza", "Spaghetti Bolognese", "Carbonara", "Arrabbiata", "Seafood Pasta", "Garlic Prawn Pasta", "Chicken Alfredo", "Beef Pasta", "Pesto Pasta", "Truffle Cream Pasta", "Chicken Steak", "Pork Steak", "Beef Steak", "Sirloin", "Ribeye", "Tenderloin", "T-Bone", "Wagyu Steak", "Eggs & Toast", "Bacon & Eggs", "Sausage & Eggs", "Full Breakfast", "Pancakes", "French Toast", "Omelette", "Breakfast Sandwich"];
const asian = ["Japanese Teriyaki Chicken", "Japanese Beef Teriyaki", "Sushi Selection", "Sashimi Selection", "Ramen", "Udon", "Yakitori", "Korean Fried Chicken", "Korean BBQ", "Bibimbap", "Bulgogi", "Chinese Fried Rice", "Sweet & Sour Chicken", "Kung Pao Chicken", "Dumplings", "Dim Sum", "Vietnamese Pho", "Vietnamese Spring Rolls", "Singapore Noodles", "Malaysian Curry"];
const healthy = ["Vegetable Green Curry", "Vegetable Red Curry", "Tofu Stir Fry", "Vegetable Pad Thai", "Vegetable Fried Rice", "Tofu Basil", "Mixed Vegetable Soup", "Garden Salad", "Caesar Salad", "Greek Salad", "Avocado Salad", "Quinoa Bowl", "Rice & Vegetable Bowl", "Healthy Chicken Bowl", "Healthy Seafood Bowl"];
const snacksDesserts = ["French Fries", "Sweet Potato Fries", "Onion Rings", "Chicken Nuggets", "Chicken Wings", "Garlic Bread", "Cheese Sticks", "Spring Rolls", "Satay", "Edamame", "Nachos", "Mixed Nuts", "Potato Chips", "Thai Snacks", "Mango Sticky Rice", "Coconut Ice Cream", "Thai Tea Ice Cream", "Fried Banana", "Banana Pancake", "Chocolate Cake", "Cheesecake", "Brownie", "Tiramisu", "Fruit Platter", "Mango Dessert", "Coconut Dessert", "Ice Cream Selection"];
const drinks = ["Thai Iced Tea", "Thai Milk Tea", "Thai Iced Coffee", "Lemongrass Drink", "Pandan Drink", "Coconut Water", "Butterfly Pea Drink", "Espresso", "Americano", "Cappuccino", "Latte", "Mocha", "Iced Coffee", "Caramel Latte", "Vanilla Latte", "Green Tea", "Jasmine Tea", "Black Tea", "Earl Grey", "Lemon Tea", "Ginger Tea", "Orange Juice", "Apple Juice", "Pineapple Juice", "Watermelon Juice", "Mango Juice", "Coconut Juice", "Passion Fruit Juice", "Mixed Fruit Juice", "Cola", "Cola Zero", "Lemon-Lime Soda", "Ginger Ale", "Tonic Water", "Soda Water", "Sparkling Water", "Still Water"];


export const catalogueCategories: CatalogueCategory[] = [
  { name: "Thai starters & salads", group: "food", description: "Bright, aromatic beginnings for a Thai-led package.", products: pricedProducts(thaiStarters, 280), indicativeFrom: 280 },
  { name: "Thai soups", group: "food", description: "Broths and hot-and-sour bowls with adjustable heat.", products: pricedProducts(thaiSoups, 320), indicativeFrom: 320 },
  { name: "Thai curries", group: "food", description: "Coconut, spice, herbs, and slow-cooked depth.", products: pricedProducts(thaiCurries, 380), indicativeFrom: 380 },
  { name: "Thai rice", group: "food", description: "Rice dishes and fragrant staples for complete packages.", products: pricedProducts(thaiRice, 240), indicativeFrom: 240 },
  { name: "Thai noodles", group: "food", description: "Street-food classics and comforting noodle bowls.", products: pricedProducts(thaiNoodles, 300), indicativeFrom: 300 },
  { name: "Thai seafood", group: "food", description: "Prawns, fish, squid, crab, and seafood sharing options.", products: pricedProducts(thaiSeafood, 520), indicativeFrom: 520 },
  { name: "Thai meat & chicken", group: "food", description: "Grilled, stir-fried, and slow-cooked meat selections.", products: pricedProducts(thaiMeat, 420), indicativeFrom: 420 },
  { name: "International & Western", group: "food", description: "Burgers, pizza, pasta, steak, and Western breakfast.", products: pricedProducts(western, 420), indicativeFrom: 420 },
  { name: "Asian favourites", group: "food", description: "Japanese, Korean, Chinese, Vietnamese, Singaporean, and Malaysian dishes.", products: pricedProducts(asian, 420), indicativeFrom: 420 },
  { name: "Vegetarian & healthy", group: "food", description: "Clearly marked vegetarian-friendly bowls, salads, tofu, and vegetable dishes.", products: pricedProducts(healthy, 300), indicativeFrom: 300, vegetarianFriendly: true },
  { name: "Snacks & desserts", group: "food", description: "Sides, small bites, Thai sweets, and familiar desserts.", products: pricedProducts(snacksDesserts, 180), indicativeFrom: 180 },
  { name: "Soft drinks, coffee, tea & juices", group: "drinks", description: "Thai drinks, hot coffee, tea, fresh juices, and soft drinks.", products: pricedProducts(drinks, 90), indicativeFrom: 90 },];

export const servicePeriods = ["Breakfast", "Lunch", "Dinner", "Snacks", "Seasonal events"] as const;


export const menuRotation = [
  { week: "Week 1", days: [["Monday", "Pad Kra Pao Chicken"], ["Wednesday", "Green Curry Chicken"], ["Friday", "Grilled Seafood"], ["Sunday", "Premium Steak"]] },
  { week: "Week 2", days: [["Monday", "Pad Thai"], ["Wednesday", "Massaman Beef"], ["Friday", "Thai Seafood BBQ"], ["Sunday", "Pasta or Steak"]] },
] as const;
