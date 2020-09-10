import * as Args from './Args';
import * as Freeze from './Freeze';

// TODO: this will probably need to be async
export const dispatch = (args: Args.BeehiveCommand): Promise<void> =>
  Args.fold<Promise<void>>(args, Freeze.freeze);
