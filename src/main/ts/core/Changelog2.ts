import { pipe } from 'fp-ts/function'
import * as P from 'parser-ts/Parser'
import * as S from 'parser-ts/Stream'
import * as marked from 'marked';

type Heading = marked.Tokens.Heading;

type Parser<I, A> = P.Parser<I, A>;

type Token = marked.Token;
type Def = marked.Tokens.Def;

// export const children = (node: Node): Node[] => {
//   const items = [];
//   let item = node.firstChild;
//   while (item) {
//     items.push(item);
//     item = item.next;
//   }
//   return items;
// };
//
// export const childrenStream = (node: Token): Stream<Node> =>
//   S.stream(children(node));

// Def doesn't have a 'type' field for some reason
export const isNotDef = (token: Token): token is Exclude<Token, Def> =>
  Object.prototype.hasOwnProperty.call(token, 'type');

export const isType = (token: Token, type: string): boolean =>
  isNotDef(token) && token.type === type;

export const isHeading = (token: Token): token is Heading =>
  isType(token, 'heading');

export const parseHeadingLevel = (level: number): Parser<Token, Heading> =>
  P.expected(
    pipe(
      P.item<Token>(),
      P.filter(isHeading),
      P.filter((t) => t.depth === level)
    ),
    `Expected heading ${level}`
  );

type Changelog = string | null;

export const parseChangelog = (): Parser<Token, Changelog> =>
  pipe(
    parseHeadingLevel(1),
    P.map((token) => token.text)
  );

export const doParse = (input: string) => {
  // const markdownParser = new commonmark.Parser();
  // const markdown = markdownParser.parse(input);
  // TODO: not null

  const options: marked.MarkedOptions = { gfm: true };
  const tokens = marked.lexer(input, options);
  console.log('yo', tokens);


  const result = parseChangelog()(S.stream(tokens));

  console.log(result);
};
