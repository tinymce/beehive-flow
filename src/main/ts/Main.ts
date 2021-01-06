#!/usr/bin/env node

import * as Parser from './args/Parser';
import * as Dispatch from './args/Dispatch';
import { eachAsync } from './utils/OptionUtils';

const main = async () => {
  const actualArgs = await Parser.parseProcessArgs();
  await eachAsync(actualArgs, Dispatch.dispatch);
};

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
