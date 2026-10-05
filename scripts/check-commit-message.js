const path = process.argv[2];
if (!path) {
  console.error("Usage: bun scripts/check-commit-message.js <message-file>");
  process.exit(1);
}

const message = await Bun.file(path).text();
if (/^[\t ]*Co-Authored-By[\t ]*:/im.test(message)) {
  console.error("Commit rejected: remove all Co-Authored-By lines from the commit message.");
  process.exit(1);
}
