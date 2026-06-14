import "server-only";

import { prisma } from "@/lib/db";
import { deleteObjects } from "@/lib/s3";

// 사용자의 모든 S3 객체(원본 영상·클립·export)를 모아 삭제한 뒤 user 행을 지운다.
// session/project/short/userSettings는 onDelete: Cascade로 함께 삭제된다.
// (ADR-0001: 계정 삭제만 S3까지 정리하고 프로젝트 삭제는 당분간 DB-only로 둔다.)
export async function deleteUserAccount(userId: string): Promise<void> {
  const projects = await prisma.project.findMany({
    where: { userId },
    select: {
      videoKey: true,
      shorts: { select: { clipKey: true, exportKey: true } },
    },
  });

  const keys = projects
    .flatMap((project) => [
      project.videoKey,
      ...project.shorts.flatMap((short) => [short.clipKey, short.exportKey]),
    ])
    .filter((key): key is string => Boolean(key));

  await deleteObjects(keys);
  await prisma.user.delete({ where: { id: userId } });
}
