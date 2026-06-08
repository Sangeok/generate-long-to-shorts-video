export async function completeUpload(projectId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/complete`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to finalize upload");
  }
}
