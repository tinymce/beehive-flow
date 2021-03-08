import { describe, it } from 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/pipeable';
import * as Files from '../../../main/ts/utils/Files';
import { Changelog, parseChangelog, parseChangelogFragment } from '../../../main/ts/core/Changelog';

const assert = chai.use(chaiAsPromised).assert;

describe('Changelog', () => {
  describe('parseChangelog', () => {
    it('rejects an empty changelog', () => {
      const data = '';
      const changelogE = parseChangelog(data);
      assert.isTrue(E.isLeft(changelogE));
      const errors = E.isLeft(changelogE) ? changelogE.left : [];
      assert.deepEqual(errors, [ 'No top level heading' ]);
    });
    it('parses a standard changelog', async () => {
      const data = await Files.readFileAsString('src/test/data/changelogs/test_ok_standard.md');
      const changelogE = parseChangelog(data);

      assert.isTrue(E.isRight(changelogE), 'Expected changelog to parse correctly');
      const changelog = pipe(changelogE, E.getOrElse((_errors) => assert.fail('Should be a changelog') as Changelog));
      assert.equal(changelog.source, data, 'Source should match input data');
      assert.deepEqual(changelog.preamble, { start: 0, end: 251 }, 'Expected preamble to have correct offsets');
      assert.deepEqual(changelog.links, { start: 5449, end: 5449 }, 'Expected links to be empty');
      assert.equal(changelog.releases.length, 4, 'Expected 4 changelog releases');
      const unreleased = changelog.releases[0];
      assert.isUndefined(unreleased.meta, 'First release in the list is "Unreleased" and so should not have a version or release date');
      assert.deepInclude(unreleased, {
        sections: [
          'Fixed'
        ],
        Fixed: {
          header: {
            start: 267,
            end: 276
          },
          list: {
            start: 277,
            end: 388
          },
          items: [
            {
              start: 277,
              end: 388,
              ticket: 'TINY-6611'
            }
          ],
          start: 267,
          end: 388
        },
        header: {
          start: 252,
          end: 265
        },
        start: 252,
        end: 388
      });
      const release1 = changelog.releases[1];
      assert.deepInclude(release1.meta?.version, { major: 5, minor: 6, patch: 2 }, 'Expected release version to match');
      assert.equal(release1.meta?.date.toFormat('yyyy-MM-dd'), '2020-12-08', 'Expected release date to match');
      assert.deepInclude(release1, {
        sections: [
          'Fixed'
        ],
        Fixed: {
          header: {
            start: 412,
            end: 421
          },
          list: {
            start: 422,
            end: 525
          },
          items: [
            {
              start: 422,
              end: 525,
              ticket: 'TINY-6783'
            }
          ],
          start: 412,
          end: 525
        },
        header: {
          start: 389,
          end: 410
        },
        start: 389,
        end: 525
      });
      const release2 = changelog.releases[2];
      assert.deepInclude(release2.meta?.version, { major: 5, minor: 6, patch: 1 }, 'Expected release version to match');
      assert.equal(release2.meta?.date.toFormat('yyyy-MM-dd'), '2020-11-25', 'Expected release date to match');
      assert.deepInclude(release2, {
        sections: [
          'Fixed'
        ],
        Fixed: {
          header: {
            start: 549,
            end: 558
          },
          list: {
            start: 559,
            end: 1005
          },
          items: [
            {
              start: 559,
              end: 668,
              ticket: 'TINY-6692'
            },
            {
              start: 669,
              end: 770,
              ticket: 'TINY-6681'
            },
            {
              start: 771,
              end: 885,
              ticket: 'TINY-6684'
            },
            {
              start: 886,
              end: 1005,
              ticket: 'TINY-6683'
            }
          ],
          start: 549,
          end: 1005
        },
        header: {
          start: 526,
          end: 547
        },
        start: 526,
        end: 1005
      });

      const release3 = changelog.releases[3];
      assert.deepInclude(release3.meta?.version, { major: 5, minor: 6, patch: 0 }, 'Expected release version to match');
      assert.equal(release3.meta?.date.toFormat('yyyy-MM-dd'), '2020-11-18', 'Expected release date to match');
      assert.deepInclude(release3, {
        sections: [
          'Added',
          'Improved',
          'Changed',
          'Fixed',
          'Security'
        ],
        Added: {
          header: {
            start: 1029,
            end: 1038
          },
          list: {
            start: 1039,
            end: 2329
          },
          items: [
            {
              start: 1039,
              end: 1195,
              ticket: 'TINY-6528'
            },
            {
              start: 1196,
              end: 1279,
              ticket: 'TINY-6487'
            },
            {
              start: 1280,
              end: 1379,
              ticket: 'TINY-6629'
            },
            {
              start: 1380,
              end: 1558,
              ticket: 'TINY-6306'
            },
            {
              start: 1559,
              end: 1712,
              ticket: 'TINY-6224'
            },
            {
              start: 1713,
              end: 1829,
              ticket: 'TINY-6483'
            },
            {
              start: 1830,
              end: 1929,
              ticket: 'TINY-6505'
            },
            {
              start: 1930,
              end: 2019,
              ticket: 'TINY-6397'
            },
            {
              start: 2020,
              end: 2136,
              ticket: 'TINY-6479'
            },
            {
              start: 2137,
              end: 2232,
              ticket: 'TINY-6021'
            },
            {
              start: 2233,
              end: 2329,
              ticket: 'TINY-6021'
            }
          ],
          start: 1029,
          end: 2329
        },
        Improved: {
          header: {
            start: 2330,
            end: 2342
          },
          list: {
            start: 2343,
            end: 2463
          },
          items: [
            {
              start: 2343,
              end: 2463,
              ticket: 'TINY-4239'
            }
          ],
          start: 2330,
          end: 2463
        },
        Changed: {
          header: {
            start: 2464,
            end: 2475
          },
          list: {
            start: 2476,
            end: 2550
          },
          items: [
            {
              start: 2476,
              end: 2550,
              ticket: 'TINY-6248'
            }
          ],
          start: 2464,
          end: 2550
        },
        Fixed: {
          header: {
            start: 2551,
            end: 2560
          },
          list: {
            start: 2561,
            end: 5328
          },
          items: [
            {
              start: 2561,
              end: 2642,
              ticket: 'TINY-6586'
            },
            {
              start: 2643,
              end: 2745,
              ticket: 'TINY-6648'
            },
            {
              start: 2746,
              end: 2841,
              ticket: 'TINY-4679'
            },
            {
              start: 2842,
              end: 2959,
              ticket: 'TINY-6622'
            },
            {
              start: 2960,
              end: 3073,
              ticket: 'TINY-6540'
            },
            {
              start: 3074,
              end: 3197,
              ticket: 'TINY-6363'
            },
            {
              start: 3198,
              end: 3293,
              ticket: 'TINY-6281'
            },
            {
              start: 3294,
              end: 3390,
              ticket: 'TINY-6600'
            },
            {
              start: 3391,
              end: 3496,
              ticket: 'TINY-6656'
            },
            {
              start: 3497,
              end: 3599,
              ticket: 'TINY-6623'
            },
            {
              start: 3600,
              end: 3695,
              ticket: 'TINY-6282'
            },
            {
              start: 3696,
              end: 3780,
              ticket: 'TINY-6541'
            },
            {
              start: 3781,
              end: 3879,
              ticket: 'TINY-6280'
            },
            {
              start: 3880,
              end: 3979,
              ticket: 'TINY-6291'
            },
            {
              start: 3980,
              end: 4089,
              ticket: 'TINY-6485'
            },
            {
              start: 4090,
              end: 4207,
              ticket: 'TINY-6268'
            },
            {
              start: 4208,
              end: 4300,
              ticket: 'TINY-6615'
            },
            {
              start: 4301,
              end: 4380,
              ticket: 'TINY-6413'
            },
            {
              start: 4381,
              end: 4503,
              ticket: 'TINY-6555'
            },
            {
              start: 4504,
              end: 4591,
              ticket: 'TINY-3321'
            },
            {
              start: 4592,
              end: 4689,
              ticket: 'TINY-6326'
            },
            {
              start: 4690,
              end: 4788,
              ticket: 'TINY-6570'
            },
            {
              start: 4789,
              end: 4887,
              ticket: 'TINY-6601'
            },
            {
              start: 4888,
              end: 4982,
              ticket: 'TINY-6646'
            },
            {
              start: 4983,
              end: 5083,
              ticket: 'TINY-6448'
            },
            {
              start: 5084,
              end: 5192,
              ticket: 'TINY-6495'
            },
            {
              start: 5193,
              end: 5328,
              ticket: 'GH-4905'
            }
          ],
          start: 2551,
          end: 5328
        },
        Security: {
          header: {
            start: 5329,
            end: 5341
          },
          list: {
            start: 5342,
            end: 5448
          },
          items: [
            {
              start: 5342,
              end: 5448,
              ticket: 'TINY-6518'
            }
          ],
          start: 5329,
          end: 5448
        },
        header: {
          start: 1006,
          end: 1027
        },
        start: 1006,
        end: 5448
      });
    });
  });
  describe('parseChangelogFragment', () => {
    it('parses an empty changelog fragment', () => {
      const data = '';
      const changelogFragmentE = parseChangelogFragment(data);
      const changelogFragment = E.isRight(changelogFragmentE) ? changelogFragmentE.right : assert.fail('Expected the changelog fragment to parse successfully');
      assert.deepEqual(changelogFragment, { sections: [] });
    });
    it('parses a changelog fragment', async () => {
      const data = await Files.readFileAsString('src/test/data/changelogs/test_ok_fragment.md');
      const changelogFragmentE = parseChangelogFragment(data);
      const changelogFragment = E.isRight(changelogFragmentE) ? changelogFragmentE.right : assert.fail('Expected the changelog fragment to parse successfully');
      assert.deepEqual(changelogFragment, {
        sections: [
          'Added',
          'Deprecated'
        ],
        Added: {
          end: 73,
          header: {
            end: 9,
            start: 0
          },
          items: [
            {
              end: 52,
              ticket: 'BLAH-101',
              start: 10
            },
            {
              end: 73,
              ticket: undefined,
              start: 53
            }
          ],
          list: {
            end: 73,
            start: 10
          },
          start: 0
        },
        Deprecated: {
          end: 137,
          header: {
            end: 88,
            start: 74
          },
          items: [
            {
              end: 137,
              ticket: 'BLAH-49',
              start: 89
            }
          ],
          list: {
            end: 137,
            start: 89
          },
          start: 74
        }
      });
    });
  });
});