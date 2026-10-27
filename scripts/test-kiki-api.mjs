const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(
  JSON.stringify({ sub: 'test-kiki', email: 'kiki@test.com', name: 'Test' })
).toString('base64url');
const token = `${header}.${payload}.dev`;
const base = 'http://127.0.0.1:4001';

async function run() {
  const health = await fetch(`${base}/health`).then((r) => r.json());
  console.log('Health:', health);

  await fetch(`${base}/api/auth/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Test', nativeLanguage: 'hi' }),
  }).then((r) => r.json());

  const chatRes = await fetch(`${base}/api/chat/message`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Mera naam Rahul hai aur main English seekhna chahta hoon' }),
  });
  const chat = await chatRes.json();
  console.log('Chat status:', chatRes.status, chat);

  const lessons = await fetch(`${base}/api/lessons`).then((r) => r.json());
  console.log('Lessons count:', lessons.lessons?.length ?? 0);
  const india = lessons.lessons?.filter((l) => l.tags?.includes('india')).length ?? 0;
  console.log('India lessons:', india);

  const roleplay = await fetch(`${base}/api/roleplay`).then((r) => r.json());
  console.log('Roleplay count:', roleplay.scenarios?.length ?? 0);

  const dashRes = await fetch(`${base}/api/progress/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dash = await dashRes.json();
  console.log('Dashboard status:', dashRes.status, dash.stats ?? dash.error);

  const voiceRes = await fetch(`${base}/api/voice/pronunciation`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expected: 'The weather is beautiful today.',
      spoken: 'The weather is beautiful today.',
    }),
  });
  const voice = await voiceRes.json();
  console.log('Voice status:', voiceRes.status, { score: voice.score, feedback: voice.feedback });
}

run().catch(console.error);
