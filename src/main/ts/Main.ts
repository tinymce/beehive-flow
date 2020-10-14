#!/usr/bin/env -S node -r "ts-node/register"

import * as Args from './args/Args';
import * as Dispatch from './args/Dispatch';

const main = async () => {
  const actualArgs = await Args.parseProcessArgs();
  await Dispatch.dispatch(actualArgs);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
