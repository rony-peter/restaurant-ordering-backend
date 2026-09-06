import { createRestaurant } from "../src/modules/restaurants/restaurant.service";

async function main() {
  const restaurant = await createRestaurant("My Restaurant");

  console.log("Restaurant created:");
  console.log(restaurant);
}

main();