import { GET as getSession } from '../auth/session/route';

export async function GET(request: Request) {
  return getSession(request);
}
