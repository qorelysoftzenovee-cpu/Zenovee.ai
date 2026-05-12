// full/path/to/app/dashboard/actions.ts
"use server";

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function getUserCredits() {
  const session = await auth();
  if (!session?.user?.id) {
    return 0; // Or throw an error
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  return user?.credits || 0;
}