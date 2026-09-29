import { POST as deleteAccountHandler } from '@/app/api/auth/delete-account/route';

export async function POST(request: Request) {
  return deleteAccountHandler(request);
}

