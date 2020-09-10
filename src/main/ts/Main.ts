import * as Args from './Args';

const main = async () => {
  const actualArgs = await Args.parseProcessArgs();
  console.log(actualArgs);
}

main();
