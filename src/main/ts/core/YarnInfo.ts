export interface Workspace {
  readonly location: string;
  readonly workspaceDependencies: string[];
  readonly mismatchedWorkspaceDependencies: string[];
}

export type Workspaces = Record<string, Workspace>;
