import { pipe } from 'fp-ts/function'
import * as P from 'parser-ts/Parser'
import * as S from 'parser-ts/Stream'
import * as marked from 'marked';

type Heading = marked.Tokens.Heading;

type Parser<I, A> = P.Parser<I, A>;

type Token = marked.Token;
type Def = marked.Tokens.Def;

// Def doesn't have a 'type' field for some reason
export const isNotDef = (token: Token): token is Exclude<Token, Def> =>
  Object.prototype.hasOwnProperty.call(token, 'type');

export const isDef = (token: Token): token is Def =>
  !Object.prototype.hasOwnProperty.call(token, 'type');

export const isType = (token: Token, type: string): boolean =>
  isNotDef(token) && token.type === type;

export const isHeading = (token: Token): token is Heading =>
  isType(token, 'heading');

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

const parseChangelogHeader = headingLiteral(1, 'Changelog');
const parseUnreleasedHeading = headingLiteral(2, 'Unreleased');

type Changelog = null;

export const parseChangelog = (): Parser<Token, Changelog> =>
  pipe(
    parseChangelogHeader,
    P.apSecond(textSection),
    P.apSecond(parseUnreleasedHeading),
    P.apSecond(P.succeed(null))
  );

export const doParse = (input: string) => {
  // const markdownParser = new commonmark.Parser();
  // const markdown = markdownParser.parse(input);


  const options: marked.MarkedOptions = { gfm: true };

  // TODO: check if this fails
  const tokens = marked.lexer(input, options);

  const result = parseChangelog()(S.stream(tokens));

  // TODO: remove
  console.log(result);

  return result;
};
