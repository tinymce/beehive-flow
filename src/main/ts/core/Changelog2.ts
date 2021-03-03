import { pipe, Predicate, Refinement } from 'fp-ts/function'
import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as P from 'parser-ts/Parser'
import * as S from 'parser-ts/Stream'
import * as ParseResult from 'parser-ts/ParseResult'
import * as marked from 'marked';
import * as Version from './Version';
import { parseVersionE } from './Version';
import { DateTime } from 'luxon';
import { sequenceS } from 'fp-ts/Apply';
import * as Ord from 'fp-ts/Ord';
import * as Eq from 'fp-ts/Eq';

type Parser<I, A> = P.Parser<I, A>;

type Token = marked.Token;
type Def = marked.Tokens.Def;
type List = marked.Tokens.List;
type Heading = marked.Tokens.Heading;

type Version = Version.Version;

export interface Unreleased {
  readonly sections: ReleaseSection[]
}

export interface VersionHeader {
  readonly version: Version;
  readonly date: DateTime;
}

export interface Release {
  readonly version: Version;
  readonly date: DateTime;
  readonly sections: ReleaseSection[];
}

export interface Changelog {
  readonly unreleased: Unreleased;
  readonly releases: Release[];
}

type SectionName = 'Added' | 'Improved' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security';

const sectionNames: SectionName[] = [ 'Added', 'Improved', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security' ];

type Entry = string;

interface ReleaseSection {
  readonly name: SectionName;
  readonly entries: Entry[];
}

/** filter that raises fatal errors if it fails */
export const hardFilter: {
  <A, B extends A>(refinement: Refinement<A, B>): <I>(p: Parser<I, A>) => Parser<I, B>
  <A>(predicate: Predicate<A>): <I>(p: Parser<I, A>) => Parser<I, A>
} = <A>(predicate: Predicate<A>) => <I>(p: Parser<I, A>): Parser<I, A> => (i) =>
  pipe(
    p(i),
    E.chain(next => (predicate(next.value) ? E.right(next) : ParseResult.error(i, undefined, true)))
  )

export const debug = <I, O> (p: Parser<I, O>): Parser<I, O> => (i) =>
  pipe(
    p(i),
    E.bimap(
      (l) => {
        console.log(i, l);
        return l;
      },
      (r) => {
        console.log(i, r);
        return r;
      }
    )
  );


// Def doesn't have a 'type' field for some reason
export const isNotDef = (token: Token): token is Exclude<Token, Def> =>
  Object.prototype.hasOwnProperty.call(token, 'type');

export const isDef = (token: Token): token is Def =>
  !Object.prototype.hasOwnProperty.call(token, 'type');

export const isType = (type: string) => (token: Token): boolean =>
  isNotDef(token) && token.type === type;

export const isHeading = (token: Token): token is Heading =>
  isType('heading')(token);

const parseHeading: Parser<Token, Heading> =
  P.expected(
    pipe(
      P.item<Token>(),
      P.filter(isHeading)
    ),
    `Expected heading`
  );

const parseHeadingLevel = (level: number): Parser<Token, Heading> =>
  P.expected(
    pipe(
      parseHeading,
      P.filter((t) => t.depth === level)
    ),
    `Expected heading ${level}`
  );

const headingLiteral = (level: number, text: string): Parser<Token, Heading> =>
  P.expected(
    pipe(
      parseHeadingLevel(level),
      P.filter((token) => token.text === text)
    ),
    `Expected heading ${level} with exact text: "${text}"`
  );

const textSection: Parser<Token, Token[]> =
  P.expected(
    P.many1(P.sat((t) => isNotDef(t) && ['paragraph', 'space', 'text'].includes(t.type))),
    'Expected section of text'
  );

const isBullist = (t: Token): t is List =>
  isNotDef(t) && t.type === 'list' && !t.ordered;

const bullist: Parser<Token, List> =
  pipe(
    P.item<Token>(),
    P.filter(isBullist)
  );

const parseChangelogHeader = headingLiteral(1, 'Changelog');
const parseUnreleasedHeading = headingLiteral(2, 'Unreleased');

const findSectionName = (s: string): s is SectionName =>
  (sectionNames as string[]).includes(s)

const parseSectionHeading: Parser<Token, SectionName> =
  P.expected(
    pipe(
      parseHeadingLevel(3),
      P.map((token) => token.text),
      hardFilter(findSectionName)
    ),
    `Expected heading 3 with one of these titles: ${sectionNames.join(', ')}`
  );

const parseSectionEntries: Parser<Token, Entry[]> =
  pipe(
    P.optional(bullist),
    P.chain((olist) =>
      pipe(
        olist,
        O.fold(
          () => P.succeed([]),
          (list) => P.succeed(list.items.map((e) => e.text))
        )
      )
    )
  );

const releaseSection: Parser<Token, ReleaseSection> =
  sequenceS(P.parser)({
    name: parseSectionHeading,
    entries: parseSectionEntries
  });

const correctOrder = <T> (input: T[], correct: T[]): boolean => {
  // Note: inefficient for large arrays
  const positions = input.map((x) => correct.indexOf(x));
  const sorted = A.sort(Ord.ordNumber)(positions);
  return A.getEq(Eq.eqNumber).equals(positions, sorted);
};

const parseCorrectOrder = <T> (actual: T[], correct: T[]): Parser<Token, null> => {
  if (!correctOrder(actual, correct)) {
    return P.expected(P.fail(), `Sections in incorrect order (${actual.join(', ')}). Correct order is ${correct.join(', ')}`);
  } else {
    return P.succeed(null);
  }
};

const noDuplicates = (input: string[]): Parser<Token, null> => {
  const r: Set<string> = new Set<string>();
  for (const s of input) {
    if (r.has(s)) {
      return P.expected(P.fail(), `Duplicate section name: ${s}`);
    } else {
      r.add(s);
    }
  }

  return P.succeed(null);
};

const releaseSections: Parser<Token, ReleaseSection[]> =
  pipe(
    P.many(releaseSection),
    P.chain((sections) => {
      const names = sections.map((s) => s.name);
      return pipe(
        P.succeed<Token, ReleaseSection[]>(sections),
        P.apFirst(parseCorrectOrder(names, sectionNames)),
        P.apFirst(noDuplicates(names))
      );
    })
  );

const unreleasedVersion: Parser<Token, Unreleased> =
  pipe(
    parseUnreleasedHeading,
    P.apSecond(releaseSections),
    P.map((sections) => ({ sections }))
  );

const releaseRe = /^(?:\[?)(?<version>\d+\.\d+\.\d+)(?:]?) - (?<date>\d{4}-\d{2}-\d{2})$/;

const parseVersionHeader = (text: string): Parser<Token, VersionHeader> => {

  const m = releaseRe.exec(text);
  const versionStr = m?.groups?.version;
  const dateStr = m?.groups?.date;

  console.log(m, versionStr, dateStr);

  if (m && versionStr && dateStr) {
    const versionE = parseVersionE(versionStr);
    const date = DateTime.fromISO(dateStr, { zone: 'utc' }); // regex already validates this format

    if (versionE._tag === 'Left') {
      return P.cut(P.expected(P.fail(), `Invalid header format parsing version. Expected: "VERSION - yyyy-mm-dd" but got: "${text}"`));
    } else {
      return P.succeed({ version: versionE.right, date })
    }
  } else {
    return P.cut(P.expected(P.fail(), `Invalid header format. Expected: "VERSION - yyyy-mm-dd" but got: "${text}"`));
  }
};

const releasedVersionHeader: Parser<Token, VersionHeader> =
  pipe(
    parseHeadingLevel(2),
    P.map((t) => t.text),
    P.chain(parseVersionHeader)
  )

const releasedVersion: Parser<Token, Release> =
  pipe(
    sequenceS(P.parser)({
      header: releasedVersionHeader,
      sections: releaseSections
    }),
    P.map(({ header, sections }) => ({ ...header, sections }))
  );

export const parseChangelog = (): Parser<Token, Changelog> =>
  pipe(
    parseChangelogHeader,
    P.apSecond(textSection),
    P.apSecond(pipe(
      sequenceS(P.parser)({
        unreleased: unreleasedVersion,
        releases: P.many(releasedVersion)
      })
    ))
  );

export const doParse = (input: string) => {
  const options: marked.MarkedOptions = { gfm: true };

  // TODO: check if this fails
  const tokens = marked.lexer(input, options);

  return parseChangelog()(S.stream(tokens));
};
