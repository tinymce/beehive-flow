#!/usr/bin/env -S node -r "ts-node/register"

import * as Args from './core/Args';
import * as Dispatch from './core/Dispatch';

const main = async () => {
  const actualArgs = await Args.parseProcessArgs();
  await Dispatch.dispatch(actualArgs);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
