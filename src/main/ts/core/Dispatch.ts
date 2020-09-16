import * as Args from './Args';
import * as Freeze from './Freeze';

export const dispatch = (args: Args.BeehiveCommand): Promise<void> =>
  Args.fold_<Promise<void>>(args, Freeze.freeze);
