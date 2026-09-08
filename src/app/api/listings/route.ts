import { GET as getProducts, POST as postProducts } from '../products/route';

export async function GET(request: Request) {
  return getProducts(request);
}

export async function POST(request: Request) {
  return postProducts(request);
}
