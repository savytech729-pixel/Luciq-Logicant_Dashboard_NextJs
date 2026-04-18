import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { execSync } from 'child_process';
import fs from 'fs';

async function run() {
  console.log('Starting MongoDB Memory Replica Set...');
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  let uri = replSet.getUri();
  // Insert 'testingdb' before the query string '?replicaSet=...'
  const urlObj = new URL(uri);
  urlObj.pathname = '/testingdb';
  uri = urlObj.toString();
  console.log(`Memory MongoDB Replica Set started at: ${uri}`);

  console.log('Updating .env file with new connection string...');
  let env = fs.readFileSync('.env', 'utf-8');
  env = env.replace(/DATABASE_URL=".+"/, `DATABASE_URL="${uri}"`);
  env = env.replace(/DATABASE_URL=.+/, `DATABASE_URL="${uri}"`);
  fs.writeFileSync('.env', env);

  console.log('Running Prisma schema push to build database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('Running Prisma seed script to insert test data...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

  console.log('\n---');
  console.log('✅ Testing Database is ready and seeded!');
  console.log('Keep this process running to keep the database alive.');
  console.log('Press Ctrl+C to stop the testing database.');
  
  // keep process running
  process.stdin.resume();
}

run().catch(console.error);
