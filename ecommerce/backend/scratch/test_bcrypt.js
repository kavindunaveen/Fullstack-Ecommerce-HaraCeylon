const bcrypt = require('bcryptjs');

async function test() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  const match = await bcrypt.compare(password, hash);
  console.log('Match:', match);
}

test();
