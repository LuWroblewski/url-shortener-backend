import * as bcrypt from 'bcrypt';

async function main() {
  const hash = await bcrypt.hash('123', 10);
  console.log(hash);
}
main();
