#!/usr/bin/env -S node

import * as Parser from './args/Parser';
import * as Dispatch from './args/Dispatch';
import { forEachAsync } from './utils/OptionUtils';

const main = async () => {
  const actualArgs = await Parser.parseProcessArgs();
  await forEachAsync(actualArgs, Dispatch.dispatch);
};

main().catch((e: any) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
