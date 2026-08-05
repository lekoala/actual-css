/*
 * parse-config.js — Relaxed configuration scanner for data-enhance-config.
 *
 * Accepts unquoted keys, single or double-quoted strings, numbers,
 * booleans, null, and nested objects/arrays. No bare values, no
 * expressions, no functions. Throws SyntaxError on invalid input.
 *
 * Unlike a regex-based approach, this scanner never modifies content
 * inside quoted strings, so URLs with colons pass through intact.
 */

const WHITESPACE = /\s/;

function isKeyStart(char) {
  return /[a-zA-Z_$]/.test(char);
}

function isKeyChar(char) {
  return /[\w$-]/.test(char);
}

function isDigit(char) {
  return /[0-9]/.test(char);
}

export function parseConfig(source) {
  if (source == null) return {};
  if (typeof source !== "string") return {};

  const str = source.trim();
  if (str === "") return {};

  let pos = 0;

  function peek() {
    return str[pos];
  }

  function advance() {
    return str[pos++];
  }

  function skipWhitespace() {
    while (pos < str.length && WHITESPACE.test(str[pos])) pos++;
  }

  function parseValue() {
    skipWhitespace();

    const char = peek();

    if (char === undefined) {
      throw new SyntaxError("Unexpected end of config.");
    }

    if (char === "{") return parseObject(true);
    if (char === "[") return parseArray();
    if (char === "'") return parseQuotedString("'");
    if (char === '"') return parseQuotedString('"');
    if (char === "-" || isDigit(char)) return parseNumber();
    if (isKeyStart(char)) return parseBareWord();

    throw new SyntaxError(`Unexpected character "${char}" at position ${pos}.`);
  }

  function parseObject(hasBraces) {
    const result = {};

    if (hasBraces) advance(); // consume {

    skipWhitespace();

    if (hasBraces && peek() === "}") {
      advance();
      return result;
    }

    while (true) {
      skipWhitespace();

      const key = parseKey();

      skipWhitespace();

      if (peek() !== ":") {
        throw new SyntaxError(`Expected ":" after key "${key}" at position ${pos}.`);
      }
      advance();

      const value = parseValue();
      result[key] = value;

      skipWhitespace();

      const char = peek();
      if (char === ",") {
        advance();
        continue;
      }
      if (hasBraces) {
        if (char === "}") {
          advance();
          return result;
        }
        throw new SyntaxError(
          `Expected "," or "}" at position ${pos}, got "${char ?? "end of input"}".`,
        );
      }
      if (char === undefined) return result;
      throw new SyntaxError(`Expected "," at position ${pos}, got "${char}".`);
    }
  }

  function parseKey() {
    skipWhitespace();
    const char = peek();

    if (char === "'" || char === '"') {
      return parseQuotedString(char);
    }

    if (!isKeyStart(char)) {
      throw new SyntaxError(`Expected key at position ${pos}, got "${char}".`);
    }

    let key = "";
    while (pos < str.length && isKeyChar(str[pos])) {
      key += advance();
    }
    return key;
  }

  function parseQuotedString(quote) {
    advance(); // consume opening quote
    let value = "";

    while (pos < str.length) {
      const char = advance();
      if (char === "\\") {
        if (pos >= str.length) {
          throw new SyntaxError("Unexpected end of string escape.");
        }
        const escaped = advance();
        if (escaped === "'") value += "'";
        else if (escaped === '"') value += '"';
        else if (escaped === "n") value += "\n";
        else if (escaped === "t") value += "\t";
        else if (escaped === "\\") value += "\\";
        else value += escaped;
      } else if (char === quote) {
        return value;
      } else {
        value += char;
      }
    }

    throw new SyntaxError("Unterminated string.");
  }

  function parseArray() {
    const result = [];
    advance(); // consume [

    skipWhitespace();

    if (peek() === "]") {
      advance();
      return result;
    }

    while (true) {
      const value = parseValue();
      result.push(value);

      skipWhitespace();

      const char = peek();
      if (char === ",") {
        advance();
        skipWhitespace();
        if (peek() === "]") {
          throw new SyntaxError("Trailing comma in array.");
        }
        continue;
      }
      if (char === "]") {
        advance();
        return result;
      }

      throw new SyntaxError(`Expected "," or "]" at position ${pos}, got "${char}".`);
    }
  }

  function parseNumber() {
    let num = "";

    if (peek() === "-") {
      num += advance();
    }

    while (pos < str.length && isDigit(str[pos])) {
      num += advance();
    }

    if (peek() === ".") {
      num += advance();
      while (pos < str.length && isDigit(str[pos])) {
        num += advance();
      }
    }

    const parsed = Number(num);

    if (Number.isNaN(parsed)) {
      throw new SyntaxError(`Invalid number "${num}".`);
    }

    return parsed;
  }

  function parseBareWord() {
    let word = "";

    while (pos < str.length && /[a-zA-Z_$\w]/.test(str[pos])) {
      word += advance();
    }

    if (word === "true") return true;
    if (word === "false") return false;
    if (word === "null") return null;

    throw new SyntaxError(`Invalid bare value "${word}". Strings must be quoted.`);
  }

  skipWhitespace();

  const rootChar = peek();
  if (rootChar === "{" || isKeyStart(rootChar)) {
    const result = parseObject(rootChar === "{");
    skipWhitespace();
    if (pos < str.length) {
      throw new SyntaxError(`Unexpected trailing content at position ${pos}.`);
    }
    return result;
  }

  if (rootChar === "'" || rootChar === '"') {
    const result = parseObject(false);
    skipWhitespace();
    if (pos < str.length) {
      throw new SyntaxError(`Unexpected trailing content at position ${pos}.`);
    }
    return result;
  }

  throw new SyntaxError(`Expected object at position ${pos}, got "${rootChar}".`);
}

export default parseConfig;
