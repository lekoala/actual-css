import { expect, test, describe } from "bun:test";
import { parseConfig } from "../src/js/parse-config.js";

describe("parseConfig", () => {
	test("returns empty object for null", () => {
		expect(parseConfig(null)).toEqual({});
	});

	test("returns empty object for undefined", () => {
		expect(parseConfig(undefined)).toEqual({});
	});

	test("returns empty object for empty string", () => {
		expect(parseConfig("")).toEqual({});
	});

	test("returns empty object for whitespace-only string", () => {
		expect(parseConfig(" \t\n ")).toEqual({});
	});

	test("returns empty object for empty object literal", () => {
		expect(parseConfig("{}")).toEqual({});
	});

	test("returns empty object for non-string inputs", () => {
		expect(parseConfig(123)).toEqual({});
		expect(parseConfig([])).toEqual({});
		expect(parseConfig({})).toEqual({});
	});

	test("parses simple key-value with single quotes", () => {
		expect(parseConfig("key: 'value'")).toEqual({ key: "value" });
	});

	test("parses simple key-value with double quotes", () => {
		expect(parseConfig('key: "value"')).toEqual({ key: "value" });
	});

	test("parses multiple key-value pairs", () => {
		expect(parseConfig("name: 'parseConfig', version: 1.0, enabled: true")).toEqual({
			name: "parseConfig",
			version: 1.0,
			enabled: true,
		});
	});

	test("parses keys with underscores and dollar signs", () => {
		expect(parseConfig("_private_key: 'secret', $id: 'user-123'")).toEqual({
			_private_key: "secret",
			$id: "user-123",
		});
	});

	test("parses hyphenated keys", () => {
		expect(parseConfig("data-id: 123")).toEqual({ "data-id": 123 });
	});

	test("parses single-quoted keys", () => {
		expect(parseConfig("'my-key': 'value'")).toEqual({ "my-key": "value" });
	});

	test("parses various data types", () => {
		expect(
			parseConfig("port: 8080, active: true, backup: false, secondary: null"),
		).toEqual({
			port: 8080,
			active: true,
			backup: false,
			secondary: null,
		});
	});

	test("parses string with spaces", () => {
		expect(parseConfig("message:'Hello world!'")).toEqual({
			message: "Hello world!",
		});
	});

	test("parses string with escaped single quote", () => {
		expect(parseConfig("title: 'It\\'s a test'")).toEqual({
			title: "It's a test",
		});
	});

	test("parses string containing double quotes", () => {
		expect(parseConfig('quote: \'He said "Hi!"\'')).toEqual({
			quote: 'He said "Hi!"',
		});
	});

	test("parses URL with colon inside double-quoted string", () => {
		expect(parseConfig('{ "url": "https://example.com" }')).toEqual({
			url: "https://example.com",
		});
	});

	test("parses URL with colon inside single-quoted string", () => {
		expect(parseConfig("url: 'http://example.com'")).toEqual({
			url: "http://example.com",
		});
	});

	test("parses label with colon inside string", () => {
		expect(parseConfig('label: "foo: bar"')).toEqual({ label: "foo: bar" });
	});

	test("parses string containing a comma", () => {
		expect(parseConfig("list: 'one, two, three'")).toEqual({
			list: "one, two, three",
		});
	});

	test("parses empty string value", () => {
		expect(parseConfig("name: ''")).toEqual({ name: "" });
	});

	test("parses array of numbers", () => {
		expect(parseConfig("values: [1, 2, 3, 4]")).toEqual({ values: [1, 2, 3, 4] });
	});

	test("parses array of mixed-quoted strings", () => {
		expect(parseConfig("items: ['item1', \"item2\"]")).toEqual({
			items: ["item1", "item2"],
		});
	});

	test("parses simple nested object", () => {
		expect(parseConfig("user: { name: 'test', id: 42 }")).toEqual({
			user: { name: "test", id: 42 },
		});
	});

	test("parses complex nesting with arrays and objects", () => {
		expect(
			parseConfig(
				"data: { users: [{name: 'A', active: true}, {name: 'B', active: false}], count: 2 }",
			),
		).toEqual({
			data: {
				users: [
					{ name: "A", active: true },
					{ name: "B", active: false },
				],
				count: 2,
			},
		});
	});

	test("handles lots of extra whitespace", () => {
		expect(parseConfig(" key \n : \t 'value' ,  anotherKey: [ 1 , 2 ] ")).toEqual(
			{
				key: "value",
				anotherKey: [1, 2],
			},
		);
	});

	test("parses already valid JSON", () => {
		expect(parseConfig('{ "key": "value", "number": 123 }')).toEqual({
			key: "value",
			number: 123,
		});
	});

	test("parses mix of quoted and unquoted keys", () => {
		expect(parseConfig(" \"quotedKey\": 'is ok', unquotedKey: 'is also ok'")).toEqual({
			quotedKey: "is ok",
			unquotedKey: "is also ok",
		});
	});

	test("handles escaped newline in string", () => {
		expect(parseConfig("message: 'Hello\\nWorld'")).toEqual({
			message: "Hello\nWorld",
		});
	});

	test("handles escaped tab in string", () => {
		expect(parseConfig("message: 'Hello\\tWorld'")).toEqual({
			message: "Hello\tWorld",
		});
	});

	test("handles negative numbers", () => {
		expect(parseConfig("offset: -42")).toEqual({ offset: -42 });
	});

	test("handles decimal numbers", () => {
		expect(parseConfig("ratio: 3.14")).toEqual({ ratio: 3.14 });
	});

	test("throws on trailing comma in object", () => {
		expect(() => parseConfig("key: 'value',")).toThrow(SyntaxError);
	});

	test("throws on trailing comma in array", () => {
		expect(() => parseConfig("items: [1, 2, ]")).toThrow(SyntaxError);
	});

	test("throws on missing colon", () => {
		expect(() => parseConfig("key 'value'")).toThrow();
	});

	test("throws on invalid key starting with number", () => {
		expect(() => parseConfig("1key: 'value'")).toThrow();
	});

	test("throws on bare unquoted value", () => {
		expect(() => parseConfig("initialView: timeGridWeek")).toThrow(SyntaxError);
	});

	test("throws on bare string value", () => {
		expect(() => parseConfig("key: bareword")).toThrow(SyntaxError);
	});

	test("throws on unterminated string", () => {
		expect(() => parseConfig("key: 'unterminated")).toThrow(SyntaxError);
	});

	test("throws on unexpected end", () => {
		expect(() => parseConfig("key: ")).toThrow(SyntaxError);
	});

	test("throws on trailing content after object", () => {
		expect(() => parseConfig("{} trailing")).toThrow(SyntaxError);
	});

	test("throws on non-object root (array)", () => {
		expect(() => parseConfig("[1, 2, 3]")).toThrow(SyntaxError);
	});

	test("throws on invalid JSON structure", () => {
		expect(() => parseConfig("{ key: 'value'")).toThrow(SyntaxError);
	});
});
