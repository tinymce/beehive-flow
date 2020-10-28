#!/usr/bin/env -S node

import * as Parser from './args/Parser';
import * as Dispatch from './args/Dispatch';

const main = async () => {
  const actualArgs = await Parser.parseProcessArgs();
  await Dispatch.dispatch(actualArgs);
};

main().catch((e: any) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
