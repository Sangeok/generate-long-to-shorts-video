"use client";

import { Fragment, useState } from "react";
import { toast } from "sonner";

import { deleteProject } from "../../actions";
import type { ProjectSummary } from "../../types";
import { ProjectCard } from "./project-card";
import { ProjectShortsShelf } from "./project-shorts-shelf";

interface VideoLibraryProps {
  projects: ProjectSummary[];
}

export const VideoLibrary = ({
  projects: initialProjects,
}: VideoLibraryProps) => {
  const [projects, setProjects] = useState(initialProjects);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  // Optimistic removal: drop the card immediately, restore it if the action
  // fails so the list never silently loses a video.
  const handleDelete = async (id: string) => {
    const previous = projects;
    setProjects((current) => current.filter((project) => project.id !== id));
    if (expandedId === id) setExpandedId(null);

    try {
      const result = await deleteProject(id);
      if (result.ok) {
        toast.success("Video deleted.");
      } else {
        // 이미 삭제된(또는 소유하지 않은) 항목: 제거를 유지하고 복원하지 않는다.
        toast.info("This video was already deleted.");
      }
    } catch {
      setProjects(previous);
      toast.error("Couldn't delete the video. Please try again.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project, index) => (
        <Fragment key={project.id}>
          <ProjectCard
            project={project}
            index={index}
            isExpanded={expandedId === project.id}
            onToggleExpand={() => handleToggleExpand(project.id)}
            onDelete={() => handleDelete(project.id)}
          />
          {expandedId === project.id && (
            <ProjectShortsShelf
              projectId={project.id}
              className="col-span-full"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};
