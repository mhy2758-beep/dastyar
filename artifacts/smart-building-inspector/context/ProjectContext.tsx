import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initializeLocalDatabase } from '@/data/localDatabase';
import { insertProject, listProjects, listStages, updateProjectRecord } from '@/data/projectRepository';
import { DEFAULT_STAGES, initialProjects, Project, Stage, createLocalId } from '@/types/inspection';

type ProjectInput = Omit<
  Project,
  'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'openViolationCount'
> & {
  openViolationCount?: number;
};

type ProjectContextValue = {
  projects: Project[];
  stages: Stage[];
  isHydrated: boolean;
  databaseError: string | null;
  addProject: (input: ProjectInput) => Promise<Project>;
  updateProject: (id: string, changes: Partial<Project>) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initializeLocalDatabase();
        const [nextProjects, nextStages] = await Promise.all([listProjects(), listStages()]);
        if (!mounted) return;
        setProjects(nextProjects);
        setStages(nextStages);
      } catch {
        if (!mounted) return;
        setDatabaseError('پایگاه داده محلی در دسترس نیست.');
        setProjects(initialProjects);
        setStages(DEFAULT_STAGES);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      stages,
      isHydrated,
      databaseError,
      addProject: async (input) => {
        const now = new Date().toISOString();
        const nextProject: Project = {
          ...input,
          id: createLocalId('project'),
          createdAt: now,
          updatedAt: now,
          openViolationCount: input.openViolationCount ?? 0,
          syncStatus: 'LOCAL',
        };
        await insertProject(nextProject);
        setProjects(await listProjects());
        return nextProject;
      },
      updateProject: async (id, changes) => {
        await updateProjectRecord(id, changes);
        setProjects(await listProjects());
      },
    }),
    [databaseError, isHydrated, projects, stages],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used inside ProjectProvider');
  }
  return context;
}