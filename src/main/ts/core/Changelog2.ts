import { pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as P from 'parser-ts/Parser'
import * as S from 'parser-ts/Stream'
import * as marked from 'marked';
import { Version } from './Version';
import * as OptionUtils from '../utils/OptionUtils';
import { DateTime } from 'luxon';

type Heading = marked.Tokens.Heading;

type Parser<I, A> = P.Parser<I, A>;

type Token = marked.Token;
type Def = marked.Tokens.Def;
type List = marked.Tokens.List;

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

export interface Unreleased {
  readonly sections: ReleaseSection[]
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
  readonly sectionName: SectionName;
  readonly entries: Entry[];
}

const releaseSectionEntries: Parser<Token, Entry[]> =
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

const releaseSection = (sectionName: SectionName): Parser<Token, ReleaseSection> =>
  pipe(
    headingLiteral(3, sectionName),
    P.apSecond(releaseSectionEntries),
    P.map((entries) => ({ sectionName, entries }))
  );

const releaseSections: Parser<Token, ReleaseSection[]> =
  pipe(
    sectionNames,
    A.traverse(P.Applicative)((name) => P.optional(releaseSection(name))),
    P.map(OptionUtils.catMaybes)
  );

const unreleasedVersion: Parser<Token, Unreleased> =
  pipe(
    parseUnreleasedHeading,
    P.apSecond(releaseSections),
    P.map((sections) => ({ sections }))
  );


export const parseChangelog = (): Parser<Token, Changelog> =>
  pipe(
    parseChangelogHeader,
    P.apSecond(textSection),
    P.apSecond(unreleasedVersion),
    P.map((unreleased) => ({ unreleased, releases: [] }))
  );

export const doParse = (input: string) => {
  // const markdownParser = new commonmark.Parser();
  // const markdown = markdownParser.parse(input);


  const options: marked.MarkedOptions = { gfm: true };

  // TODO: check if this fails
  const tokens = marked.lexer(input, options);

  const result = parseChangelog()(S.stream(tokens));

  // TODO: remove
  console.log(JSON.stringify(
    pipe(result, E.map((r) => r.value)),
    null,
    2
  ));

  return result;
};
