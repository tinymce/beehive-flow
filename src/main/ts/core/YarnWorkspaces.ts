import * as t from 'io-ts';
import cs from 'cross-spawn-promise';
import * as PromiseUtils from '../utils/PromiseUtils';
import * as JsonUtils from '../utils/JsonUtils';

export interface Workspace {
  readonly location: string;
  readonly workspaceDependencies: string[];
  readonly mismatchedWorkspaceDependencies: string[];
}

export type Workspaces = Record<string, Workspace>;

export const codecWorkspace: t.Type<Workspace, unknown> = t.type({
  location: t.string,
  workspaceDependencies: t.array(t.string),
  mismatchedWorkspaceDependencies: t.array(t.string)
});

export const codecWorkspaces: t.Type<Workspaces, unknown> =
  t.record(t.string, codecWorkspace);

export const decode = async (j: unknown): Promise<Workspaces> =>
  PromiseUtils.eitherToPromise(codecWorkspaces.decode(j));

export const parse = (input: string): Promise<Workspaces> =>
  JsonUtils.parse(input).then(decode);

export const info = async (cwd: string): Promise<Workspaces> => {
  const output = await cs('yarn', [ '-s', 'workspaces', 'info' ], { cwd });
  return parse(output.toString());
};
