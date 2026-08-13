import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initialProjects, Project, createLocalId } from '@/types/inspection';

const PROJECTS_STORAGE_KEY = '@inspector/projects';

type ProjectInput = Omit<
  Project,
  'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'openViolationCount'
> & {
  openViolationCount?: number;
};

type ProjectContextValue = {
  projects: Project[];
  isHydrated: boolean;
  addProject: (input: ProjectInput) => Promise<Project>;
  updateProject: (id: string, changes: Partial<Project>) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(PROJECTS_STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored) {
          setProjects(JSON.parse(stored) as Project[]);
        } else {
          AsyncStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(initialProjects)).catch(() => undefined);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setIsHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const persist = async (nextProjects: Project[]) => {
    setProjects(nextProjects);
    await AsyncStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(nextProjects));
  };

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      isHydrated,
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
        await persist([nextProject, ...projects]);
        return nextProject;
      },
      updateProject: async (id, changes) => {
        const nextProjects = projects.map((project) =>
          project.id === id
          ? { ...project, ...changes, updatedAt: new Date().toISOString(), syncStatus: 'PENDING' as const }
            : project,
        );
        await persist(nextProjects);
      },
    }),
    [isHydrated, projects],
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