// Mock API for the campus data (stores, products, buildings, slots).
//
// By default the data is read from the local JSON file and returned after a
// short delay, so the screens behave like they are calling a real server
// (loading indicator, async/await, error handling).
//
// To use json-server instead:
//   1. npx json-server src/data/campus.json --port 3000
//   2. set API_URL below to "http://<your-computer-IP>:3000"
import campusData from '../data/campus.json';

const API_URL = null; // e.g. 'http://192.168.1.10:3000'
const FAKE_DELAY_MS = 400;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(resource) {
  if (API_URL) {
    const response = await fetch(`${API_URL}/${resource}`);
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }
  await wait(FAKE_DELAY_MS);
  return campusData[resource];
}

export const getStores = () => get('stores');
export const getBuildings = () => get('buildings');
export const getDeliverySlots = () => get('deliverySlots');
export const getPrintPrices = () => get('printPrices');

export async function getProductsByStore(storeId) {
  const products = await get('products');
  return products.filter((p) => p.storeId === storeId);
}

export async function getStore(storeId) {
  const stores = await getStores();
  return stores.find((s) => s.id === storeId);
}

// Small synchronous lookups (used for things that never change, like
// the list of faculties in the sign-up form)
export const faculties = campusData.faculties;
export const couriers = campusData.couriers;
export const demoUser = campusData.demoUser;
export const allStores = campusData.stores;
export const allProducts = campusData.products;
export const allSlots = campusData.deliverySlots;
export const allBuildings = campusData.buildings;
export const printPrices = campusData.printPrices;
