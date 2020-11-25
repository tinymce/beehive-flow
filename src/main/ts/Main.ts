#!/usr/bin/env -S node

import * as Parser from './args/Parser';
import * as Dispatch from './args/Dispatch';

const main = async () => {
  const actualArgs = await Parser.parseProcessArgs();
  if (actualArgs._tag === 'Some') {
    await Dispatch.dispatch(actualArgs.value);
  }
};

main().catch((e: any) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  process.exit(1);
});
