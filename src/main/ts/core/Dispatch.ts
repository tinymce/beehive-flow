import * as Args from './Args';
import * as Prep from './Prep';

export const dispatch = (args: Args.BeehiveArgs): Promise<void> =>
  Args.fold_<Promise<void>>(args, Prep.prep);
