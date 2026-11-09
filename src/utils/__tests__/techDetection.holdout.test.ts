import { describe, expect, it } from 'vitest';
import { detectTech } from '../techDetection';

interface Case {
  name: string;
  code?: string;
  body?: string;
  title?: string;
  url?: string;
  primary: string;
  language?: string;
}

/** Snippets written independently of the rules, to catch over-fitting. */
const CASES: Case[] = [
  { name: 'next middleware', code: "import { NextResponse } from 'next/server';\nimport type { NextRequest } from 'next/server';\n\nexport function middleware(req: NextRequest) {\n  return NextResponse.redirect(new URL('/login', req.url));\n}", primary: 'nextjs', language: 'typescript' },
  { name: 'next server action', code: "'use server';\n\nimport { revalidatePath } from 'next/cache';\n\nexport async function save(formData: FormData) {\n  revalidatePath('/');\n}", primary: 'nextjs' },
  { name: 'react context', code: "const ThemeContext = createContext('light');\n\nfunction App() {\n  const theme = useContext(ThemeContext);\n  return <ThemeContext.Provider value={theme}><Toolbar /></ThemeContext.Provider>;\n}", primary: 'react', language: 'javascript' },
  { name: 'react memo callback', code: 'const handle = useCallback(() => {\n  setOpen((o) => !o);\n}, []);\nconst v = useMemo(() => compute(a), [a]);', primary: 'react' },
  { name: 'vue options api', code: "export default {\n  data() {\n    return { count: 0 };\n  },\n  computed: { double() { return this.count * 2; } },\n  mounted() {},\n};\n// template: <div v-for=\"i in items\" :key=\"i.id\">{{ i }}</div>", primary: 'vuejs' },
  { name: 'angular service', code: "@Injectable({ providedIn: 'root' })\nexport class DataService {\n  constructor(private http: HttpClient) {}\n  get(): Observable<Item[]> {\n    return this.http.get<Item[]>('/api');\n  }\n}", primary: 'angular', language: 'typescript' },
  { name: 'svelte store', code: "import { writable } from 'svelte/store';\n\nexport const count = writable(0);", primary: 'svelte' },
  { name: 'express router ts', code: "import { Router, Request, Response } from 'express';\n\nconst router = Router();\nrouter.get('/health', (req: Request, res: Response) => res.json({ ok: true }));\nexport default router;", primary: 'express', language: 'typescript' },
  { name: 'koa-ish node http', code: "const http = require('http');\n\nhttp.createServer((req, res) => {\n  res.writeHead(200);\n  res.end('hi');\n}).listen(8080);", primary: 'nodejs', language: 'javascript' },
  { name: 'axios fetch', code: "import axios from 'axios';\n\nconst { data } = await axios.get('/api/users', { params: { page: 1 } });", primary: 'axios' },
  { name: 'trpc', code: "import { initTRPC } from '@trpc/server';\n\nconst t = initTRPC.create();\nexport const appRouter = t.router({ hello: t.procedure.query(() => 'hi') });", primary: 'trpc' },
  { name: 'typeorm', code: "@Entity()\nexport class User {\n  @PrimaryGeneratedColumn()\n  id: number;\n\n  @Column()\n  name: string;\n}", primary: 'typeorm', language: 'typescript' },
  { name: 'django view', code: 'def post_list(request):\n    posts = Post.objects.filter(published=True)\n    return render(request, "blog/list.html", {"posts": posts})', primary: 'django', language: 'python' },
  { name: 'django rest', code: 'from rest_framework import serializers, viewsets\n\nclass UserSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = User\n        fields = "__all__"', primary: 'djangorest', language: 'python' },
  { name: 'python asyncio', code: 'import asyncio\n\nasync def main():\n    await asyncio.sleep(1)\n\nasyncio.run(main())', primary: 'python', language: 'python' },
  { name: 'python dataclass', code: 'from dataclasses import dataclass\n\n@dataclass\nclass P:\n    x: int\n    y: int = 0', primary: 'python', language: 'python' },
  { name: 'matplotlib', code: 'import matplotlib.pyplot as plt\n\nplt.plot([1, 2, 3])\nplt.show()', primary: 'matplotlib', language: 'python' },
  { name: 'sklearn', code: 'from sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\n\nX_train, X_test = train_test_split(X)', primary: 'scikitlearn', language: 'python' },
  { name: 'tensorflow', code: 'import tensorflow as tf\n\nmodel = tf.keras.Sequential([tf.keras.layers.Dense(10)])', primary: 'tensorflow', language: 'python' },
  { name: 'selenium', code: 'from selenium import webdriver\n\ndriver = webdriver.Chrome()\ndriver.get("https://x.com")', primary: 'selenium', language: 'python' },
  { name: 'go http', code: 'package main\n\nimport (\n\t"net/http"\n)\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n\tw.Write([]byte("ok"))\n}', primary: 'go', language: 'go' },
  { name: 'go struct tags', code: 'type User struct {\n\tID   int    `json:"id"`\n\tName string `json:"name"`\n}\n\nfunc (u *User) Hello() string { return u.Name }', primary: 'go', language: 'go' },
  { name: 'rust async tokio', code: 'use tokio::net::TcpListener;\n\n#[tokio::main]\nasync fn main() -> Result<(), Box<dyn std::error::Error>> {\n    let l = TcpListener::bind("0.0.0.0:80").await?;\n    Ok(())\n}', primary: 'rust', language: 'rust' },
  { name: 'java streams', code: 'List<String> out = users.stream()\n    .filter(u -> u.isActive())\n    .map(User::getName)\n    .collect(Collectors.toList());', primary: 'java', language: 'java' },
  { name: 'kotlin android', code: 'class MainActivity : AppCompatActivity() {\n    override fun onCreate(savedInstanceState: Bundle?) {\n        super.onCreate(savedInstanceState)\n        setContentView(R.layout.activity_main)\n    }\n}', primary: 'android', language: 'kotlin' },
  { name: 'compose', code: '@Composable\nfun Greeting(name: String) {\n    Text(text = "Hello $name")\n}', primary: 'jetpackcompose', language: 'kotlin' },
  { name: 'swiftui', code: 'struct ContentView: View {\n    @State private var n = 0\n    var body: some View {\n        Text("\\(n)")\n    }\n}', primary: 'swiftui', language: 'swift' },
  { name: 'ruby block', code: "[1, 2, 3].each do |n|\n  puts n * 2\nend\n\nrequire 'json'", primary: 'ruby', language: 'ruby' },
  { name: 'php class', code: "<?php\n\nclass User\n{\n    private string $name;\n\n    public function __construct(string $name)\n    {\n        $this->name = $name;\n    }\n}", primary: 'php', language: 'php' },
  { name: 'wordpress', code: "<?php\nadd_action('wp_enqueue_scripts', function () {\n    wp_enqueue_style('main', get_stylesheet_uri());\n});\n$posts = get_posts(['numberposts' => 5]);", primary: 'wordpress', language: 'php' },
  { name: 'c pointers', code: '#include <stdlib.h>\n\nstruct node { int v; struct node *next; };\n\nstruct node *mk(int v) {\n    struct node *n = malloc(sizeof(struct node));\n    n->v = v;\n    return n;\n}', primary: 'c', language: 'c' },
  { name: 'cpp templates', code: 'template <typename T>\nclass Stack {\n    std::vector<T> items;\npublic:\n    void push(const T& x) { items.push_back(x); }\n};', primary: 'cplusplus', language: 'cplusplus' },
  { name: 'assembly', code: 'section .text\nglobal _start\n_start:\n    mov eax, 1\n    mov ebx, 0\n    int 0x80', primary: 'assembly', language: 'assembly' },
  { name: 'json config', code: '{\n  "name": "app",\n  "version": "1.0.0",\n  "private": true\n}', primary: 'json', language: 'json' },
  { name: 'toml', code: '[package]\nname = "app"\nversion = "0.1.0"\n\n[dependencies]\nserde = "1"', primary: 'toml', language: 'toml' },
  { name: 'markdown prose', body: 'This guide explains how to structure a monorepo and when to split services.', primary: 'javascript' },
  { name: 'ansible', code: '- hosts: web\n  become: yes\n  tasks:\n    - name: install nginx\n      apt:\n        name: nginx\n        state: present', primary: 'ansible', language: 'yaml' },
  { name: 'helm', code: '{{- if .Values.ingress.enabled }}\napiVersion: networking.k8s.io/v1\nkind: Ingress\n{{- end }}', primary: 'helm' },
  { name: 'webpack config', code: "module.exports = {\n  entry: './src/index.js',\n  module: { rules: [{ test: /\\.js$/, use: 'babel-loader' }] },\n  plugins: [new HtmlWebpackPlugin()],\n};", primary: 'webpack', language: 'javascript' },
  { name: 'eslint config', code: "module.exports = {\n  extends: ['eslint:recommended', 'plugin:react/recommended'],\n  rules: { 'no-unused-vars': 'warn' },\n};", primary: 'eslint' },
  { name: 'cypress', code: "describe('home', () => {\n  it('loads', () => {\n    cy.visit('/');\n    cy.get('[data-test=btn]').click();\n  });\n});", primary: 'cypressio', language: 'javascript' },
  { name: 'three.js', code: "import * as THREE from 'three';\n\nconst scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);", primary: 'threejs' },
  { name: 'socket.io', code: "import { io } from 'socket.io-client';\n\nconst socket = io('http://localhost:3000');\nsocket.on('connect', () => {});", primary: 'socketio' },
  { name: 'mui', code: "import { Button, TextField } from '@mui/material';\n\nexport const F = () => <Button variant=\"contained\">Go</Button>;", primary: 'materialui' },
  { name: 'shadcn cn', code: "import { cn } from '@/lib/utils';\nimport { Button } from '@/components/ui/button';\n\nexport const X = () => <Button className={cn('a')}>x</Button>;", primary: 'shadcn' },
  { name: 'flutter widget', code: "class MyApp extends StatelessWidget {\n  @override\n  Widget build(BuildContext context) {\n    return MaterialApp(home: Scaffold(body: Text('hi')));\n  }\n}", primary: 'flutter', language: 'dart' },
  { name: 'bun', code: "const server = Bun.serve({\n  port: 3000,\n  fetch(req) { return new Response('hi'); },\n});", primary: 'bun' },
  { name: 'deno', code: "import { serve } from 'https://deno.land/std/http/server.ts';\n\nDeno.serve((req) => new Response('hi'));", primary: 'denojs' },
  { name: 'mongodb node driver', code: "const { MongoClient } = require('mongodb');\nconst client = new MongoClient(uri);\nawait client.db('x').collection('y').insertOne({ a: 1 });", primary: 'mongodb' },
  { name: 'postgres node', code: "import { Pool } from 'pg';\n\nconst pool = new Pool({ connectionString });\nconst { rows } = await pool.query('SELECT NOW()');", primary: 'postgresql' },
  { name: 'stack overflow page', title: 'javascript - How to flatten an array - Stack Overflow', url: 'https://stackoverflow.com/questions/1', body: 'You can use Array.prototype.flat() in modern browsers.', primary: 'javascript', language: 'javascript' },
  { name: 'mdn css', title: 'grid-template-columns - CSS: Cascading Style Sheets | MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns', body: 'The grid-template-columns CSS property defines the line names and track sizing functions of the grid columns.', primary: 'css3', language: 'css3' },
  { name: 'mdn html', title: '<dialog>: The Dialog element - HTML | MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog', body: 'The <dialog> HTML element represents a modal or non-modal dialog box.', primary: 'html5', language: 'html5' },
  { name: 'go docs', title: 'Effective Go - The Go Programming Language', url: 'https://go.dev/doc/effective_go', body: 'Go is a new language. Goroutines and channels.', primary: 'go', language: 'go' },
  { name: 'postgres docs', title: 'PostgreSQL: Documentation: 16: CREATE INDEX', url: 'https://www.postgresql.org/docs/16/sql-createindex.html', body: 'CREATE INDEX constructs an index on the specified column(s) of the specified relation.', primary: 'postgresql' },
  { name: 'vue docs', title: 'Reactivity Fundamentals | Vue.js', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html', body: 'In Vue, state is reactive.', primary: 'vuejs' },
  { name: 'aws docs', title: 'What is Amazon S3? - Amazon Simple Storage Service', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html', body: 'Amazon S3 is an object storage service.', primary: 'amazonwebservices' },
  { name: 'git docs', title: 'Git - git-rebase Documentation', url: 'https://git-scm.com/docs/git-rebase', body: 'Reapply commits on top of another base tip.', primary: 'git' },
  { name: 'redis docs', title: 'Redis data types | Docs', url: 'https://redis.io/docs/latest/develop/data-types/', body: 'Redis is a data structure server.', primary: 'redis' },
];

describe('detectTech hold-out corpus', () => {
  it.each(CASES)('$name', (testCase) => {
    const result = detectTech({
      code: testCase.code,
      body: testCase.body,
      title: testCase.title,
      url: testCase.url,
    });
    const debug = JSON.stringify({ c: result.candidates.slice(0, 4), l: result.languageScores });
    const actual: Record<string, string> = { primary: result.primaryTech, debug };
    const expected: Record<string, string> = { primary: testCase.primary, debug };

    if (testCase.language) {
      actual.language = result.language;
      expected.language = testCase.language;
    }

    expect(actual).toEqual(expected);
  });
});

describe('detectTech performance', () => {
  it('handles large captures quickly', () => {
    const chunk = "import { useState } from 'react';\nconst [a, setA] = useState(0);\n// " + 'lorem ipsum dolor sit amet '.repeat(20) + '\n';
    const code = chunk.repeat(300);
    const started = performance.now();
    const result = detectTech({ code, body: code });

    expect(result.primaryTech).toBe('react');
    expect(performance.now() - started).toBeLessThan(800);
  });

  it('does not hang on pathological input', () => {
    const code = `${'a: b\n'.repeat(3000)}${' '.repeat(5000)}x`;
    const started = performance.now();

    detectTech({ code });
    expect(performance.now() - started).toBeLessThan(1500);
  });
});
