# beehive-flow

## Debugging

- For assistance when debugging, in `/utils/Files.ts` you can modify the default `DirOptions` parameters in the `tempFolder()` function to keep the local repositories generated by `beehive-flow`.
  The directory paths are printed in the test output, they can be treated as normal git repositories in your CLI.
