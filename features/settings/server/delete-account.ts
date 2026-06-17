import "server-only";

import { prisma } from "@/lib/db";
import { deleteObjects } from "@/lib/s3";

// Collect and delete all user-owned S3 objects (source videos, clips, exports), then delete the user from the database.
export async function deleteUserAccount(userId: string): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { userId },
    select: {
      videoKey: true,
      shorts: { select: { clipKey: true, exportKey: true } },
    },
  });

  const s3Keys = projects
    .flatMap((project) => [
      project.videoKey,
      ...project.shorts.flatMap((short) => [short.clipKey, short.exportKey]),
    ])
    .filter((key): key is string => Boolean(key));

  await deleteObjects(s3Keys);
  await prisma.user.delete({ where: { id: userId } });
}
