import { describe, expect, it } from 'vitest';
import { TECH_CATALOG, resolveTechSlug } from '../techCatalog';
import { DEVICON_VARIANTS } from '../deviconIndex';
import { detectTech } from '../techDetection';
import { getDeviconUrlCandidates } from '../techIcon';

interface Case {
  name: string;
  code?: string;
  body?: string;
  title?: string;
  url?: string;
  primary: string;
  language: string;
}

const CASES: Case[] = [
  // ── Languages ──
  { name: 'plain python', code: 'def add(a, b):\n    return a + b\n\nprint(add(1, 2))', primary: 'python', language: 'python' },
  { name: 'python class + typing', code: 'from typing import List\n\nclass User:\n    def __init__(self, name: str) -> None:\n        self.name = name\n', primary: 'python', language: 'python' },
  { name: 'go', code: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("hi")\n}', primary: 'go', language: 'go' },
  { name: 'rust', code: 'fn main() {\n    let mut v: Vec<i32> = Vec::new();\n    v.push(1);\n    println!("{:?}", v);\n}', primary: 'rust', language: 'rust' },
  { name: 'java', code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}', primary: 'java', language: 'java' },
  { name: 'kotlin', code: 'fun main() {\n    val names = listOf("a", "b")\n    println(names)\n}', primary: 'kotlin', language: 'kotlin' },
  { name: 'swift', code: 'import Foundation\n\nstruct User {\n    let name: String\n}\nlet u = User(name: "x")\nguard let n = Optional(u.name) else { return }', primary: 'swift', language: 'swift' },
  { name: 'csharp', code: 'using System;\n\nnamespace App {\n    public class Program {\n        public static void Main(string[] args) {\n            Console.WriteLine("hi");\n        }\n    }\n}', primary: 'csharp', language: 'csharp' },
  { name: 'cpp', code: '#include <iostream>\n\nint main() {\n    std::cout << "hi" << std::endl;\n    return 0;\n}', primary: 'cplusplus', language: 'cplusplus' },
  { name: 'c', code: '#include <stdio.h>\n\nint main(void) {\n    printf("hi\\n");\n    return 0;\n}', primary: 'c', language: 'c' },
  { name: 'php', code: '<?php\n\nnamespace App;\n\nfunction hello($name) {\n    echo "Hello $name";\n}', primary: 'php', language: 'php' },
  { name: 'ruby', code: 'class User\n  attr_accessor :name\n\n  def initialize(name)\n    @name = name\n  end\nend\n\nputs User.new("x").name', primary: 'ruby', language: 'ruby' },
  { name: 'dart', code: "import 'package:flutter/material.dart';\n\nvoid main() {\n  print('hi');\n}", primary: 'flutter', language: 'dart' },
  { name: 'elixir', code: 'defmodule Greeter do\n  def hello(name) do\n    IO.puts("Hello #{name}")\n  end\nend', primary: 'elixir', language: 'elixir' },
  { name: 'bash', code: '#!/bin/bash\nset -euo pipefail\nfor f in *.txt; do\n  echo "$f"\ndone', primary: 'bash', language: 'bash' },
  { name: 'lua', code: 'local function greet(name)\n  print("hi " .. name)\nend\ngreet("x")', primary: 'lua', language: 'lua' },
  { name: 'haskell', code: 'module Main where\n\nmain :: IO ()\nmain = putStrLn "hi"', primary: 'haskell', language: 'haskell' },
  { name: 'solidity', code: 'pragma solidity ^0.8.0;\n\ncontract Token {\n    mapping(address => uint256) public balances;\n}', primary: 'solidity', language: 'solidity' },
  { name: 'powershell', code: 'Get-ChildItem -Path . | Where-Object { $_.Length -gt 100 } | Select-Object Name', primary: 'powershell', language: 'powershell' },
  { name: 'scala', code: 'object Main extends App {\n  val xs = List(1, 2, 3)\n  println(xs.map(_ * 2))\n}', primary: 'scala', language: 'scala' },
  { name: 'sql select', code: 'SELECT u.id, u.name FROM users u\nJOIN orders o ON o.user_id = u.id\nWHERE o.total > 100\nORDER BY u.name;', primary: 'sql', language: 'sql' },
  { name: 'html', code: '<!DOCTYPE html>\n<html lang="en">\n<head><title>x</title></head>\n<body><div class="a"><p>hi</p></div></body>\n</html>', primary: 'html5', language: 'html5' },
  { name: 'plain css', code: '.card {\n  display: flex;\n  margin: 0 auto;\n  color: #333;\n}\n\n@media (min-width: 600px) {\n  .card { padding: 1rem; }\n}', primary: 'css3', language: 'css3' },
  { name: 'scss', code: '$primary: #333;\n\n.card {\n  @include mixin($primary);\n  &:hover { color: darken($primary, 10%); }\n}', primary: 'sass', language: 'sass' },
  { name: 'plain yaml', code: 'name: ci\non:\n  push:\n    branches: [main]\n    paths: [src]\n', primary: 'yaml', language: 'yaml' },

  // ── JS / TS ──
  { name: 'plain js', code: 'const items = [1, 2, 3];\nitems.map((x) => x * 2).forEach((x) => console.log(x));', primary: 'javascript', language: 'javascript' },
  { name: 'plain ts', code: 'interface User {\n  id: number;\n  name: string;\n}\n\nconst getUser = (id: number): User => ({ id, name: "x" });', primary: 'typescript', language: 'typescript' },
  { name: 'ts generics', code: 'function first<T>(items: T[]): T | undefined {\n  return items[0];\n}\ntype Id = string | number;', primary: 'typescript', language: 'typescript' },

  // ── Frontend frameworks ──
  { name: 'react hooks', code: "import { useState, useEffect } from 'react';\n\nexport function Counter() {\n  const [n, setN] = useState(0);\n  useEffect(() => { document.title = String(n); }, [n]);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}", primary: 'react', language: 'javascript' },
  { name: 'react tsx', code: "import { useState } from 'react';\n\ninterface Props { label: string }\n\nexport const Btn = ({ label }: Props) => {\n  const [on, setOn] = useState<boolean>(false);\n  return <button className=\"btn\" onClick={() => setOn(!on)}>{label}</button>;\n};", primary: 'react', language: 'typescript' },
  { name: 'nextjs app router', code: "import Link from 'next/link';\nimport { notFound } from 'next/navigation';\n\nexport default async function Page({ params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params;\n  if (!id) notFound();\n  return <Link href=\"/\">home</Link>;\n}", primary: 'nextjs', language: 'typescript' },
  { name: 'nextjs docs url', title: 'Routing: Dynamic Routes', url: 'https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes', body: 'Dynamic segments let you create routes from dynamic data.', primary: 'nextjs', language: 'typescript' },
  { name: 'vue sfc', code: '<script setup lang="ts">\nimport { ref } from "vue";\nconst count = ref(0);\n</script>\n<template>\n  <button @click="count++">{{ count }}</button>\n</template>', primary: 'vuejs', language: 'typescript' },
  { name: 'vue router is not next', code: "import { createRouter, createWebHistory } from 'vue-router';\n\nconst router = createRouter({ history: createWebHistory(), routes: [] });\nexport default router;", primary: 'vuejs', language: 'javascript' },
  { name: 'pinia is not zustand', code: "import { defineStore } from 'pinia';\n\nexport const useCounter = defineStore('counter', {\n  state: () => ({ n: 0 }),\n});", primary: 'vuejs', language: 'javascript' },
  { name: 'nuxt', code: "export default defineNuxtConfig({\n  modules: ['@nuxt/ui'],\n});\nconst { data } = await useFetch('/api/x');", primary: 'nuxtjs', language: 'javascript' },
  { name: 'angular component', code: "import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-root',\n  templateUrl: './app.component.html',\n})\nexport class AppComponent {\n  title = 'x';\n  constructor(private http: HttpClient) {}\n}", primary: 'angular', language: 'typescript' },
  { name: 'nest is not angular', code: "import { Controller, Get, Injectable } from '@nestjs/common';\n\n@Controller('cats')\nexport class CatsController {\n  constructor(private readonly svc: CatsService) {}\n  @Get()\n  findAll() { return []; }\n}", primary: 'nestjs', language: 'typescript' },
  { name: 'svelte', code: '<script>\n  let count = 0;\n  $: doubled = count * 2;\n</script>\n\n<button on:click={() => count++}>{count}</button>', primary: 'svelte', language: 'javascript' },
  { name: 'solid', code: "import { createSignal, createEffect } from 'solid-js';\n\nconst [n, setN] = createSignal(0);", primary: 'solidjs', language: 'javascript' },
  { name: 'astro', code: '---\nimport Layout from "../layouts/Layout.astro";\nconst { title } = Astro.props;\n---\n<Layout title={title}><h1>Hi</h1></Layout>', primary: 'astro', language: 'javascript' },
  { name: 'jquery', code: "$(document).ready(function () {\n  $('#btn').on('click', function () {\n    $('.box').fadeIn();\n  });\n});", primary: 'jquery', language: 'javascript' },
  { name: 'react native', code: "import { View, Text, StyleSheet } from 'react-native';\n\nexport default function App() {\n  return <View style={styles.c}><Text>hi</Text></View>;\n}\nconst styles = StyleSheet.create({ c: { flex: 1 } });", primary: 'reactnative', language: 'javascript' },

  // ── State / data libs ──
  { name: 'zustand', code: "import { create } from 'zustand';\n\nexport const useStore = create<State>((set) => ({\n  n: 0,\n  inc: () => set((s) => ({ n: s.n + 1 })),\n}));", primary: 'zustand', language: 'typescript' },
  { name: 'redux toolkit', code: "import { createSlice, configureStore } from '@reduxjs/toolkit';\n\nconst slice = createSlice({ name: 'c', initialState: 0, reducers: {} });", primary: 'redux', language: 'javascript' },
  { name: 'tanstack query', code: "import { useQuery } from '@tanstack/react-query';\n\nconst { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });", primary: 'tanstack-query', language: 'javascript' },
  { name: 'zod', code: "import { z } from 'zod';\n\nconst schema = z.object({ name: z.string().min(1), age: z.number() });\ntype T = z.infer<typeof schema>;", primary: 'zod', language: 'typescript' },
  { name: 'prisma', code: "import { PrismaClient } from '@prisma/client';\n\nconst prisma = new PrismaClient();\nconst users = await prisma.user.findMany({ where: { active: true } });", primary: 'prisma', language: 'javascript' },
  { name: 'prisma schema', code: 'model User {\n  id    Int    @id @default(autoincrement())\n  email String @unique\n  posts Post[]\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}', primary: 'prisma', language: 'typescript' },
  { name: 'drizzle', code: "import { pgTable, serial, text } from 'drizzle-orm/pg-core';\n\nexport const users = pgTable('users', { id: serial('id').primaryKey(), name: text('name') });", primary: 'drizzle', language: 'javascript' },
  { name: 'mongoose', code: "import mongoose from 'mongoose';\n\nconst UserSchema = new mongoose.Schema({ name: String });\nexport const User = mongoose.model('User', UserSchema);", primary: 'mongoose', language: 'javascript' },
  { name: 'sqlalchemy', code: 'from sqlalchemy import Column, Integer, String\nfrom sqlalchemy.orm import declarative_base\n\nBase = declarative_base()\n\nclass User(Base):\n    __tablename__ = "users"\n    id = Column(Integer, primary_key=True)', primary: 'sqlalchemy', language: 'python' },

  // ── Backend ──
  { name: 'express', code: "const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => res.send('ok'));\napp.listen(3000);", primary: 'express', language: 'javascript' },
  { name: 'fastify', code: "import Fastify from 'fastify';\n\nconst app = Fastify({ logger: true });\napp.get('/', async () => ({ ok: true }));", primary: 'fastify', language: 'javascript' },
  { name: 'django', code: 'from django.db import models\nfrom django.http import HttpResponse\n\nclass Post(models.Model):\n    title = models.CharField(max_length=100)', primary: 'django', language: 'python' },
  { name: 'flask', code: "from flask import Flask, jsonify\n\napp = Flask(__name__)\n\n@app.route('/')\ndef index():\n    return jsonify(ok=True)", primary: 'flask', language: 'python' },
  { name: 'fastapi', code: 'from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\n@app.get("/items/{id}")\nasync def read(id: int):\n    return {"id": id}', primary: 'fastapi', language: 'python' },
  { name: 'spring', code: '@RestController\n@RequestMapping("/api")\npublic class UserController {\n    @Autowired\n    private UserService svc;\n\n    @GetMapping("/users")\n    public List<User> all() { return svc.all(); }\n}', primary: 'spring', language: 'java' },
  { name: 'laravel', code: "<?php\n\nuse Illuminate\\Support\\Facades\\Route;\n\nRoute::get('/users', [UserController::class, 'index']);", primary: 'laravel', language: 'php' },
  { name: 'rails', code: 'class UsersController < ApplicationController\n  before_action :set_user\n\n  def show\n    render json: @user\n  end\nend', primary: 'rails', language: 'ruby' },
  { name: 'node fs', code: "const fs = require('fs');\nconst path = require('path');\n\nfs.readFileSync(path.join(__dirname, 'a.txt'), 'utf8');\nprocess.env.PORT;", primary: 'nodejs', language: 'javascript' },
  { name: 'hono', code: "import { Hono } from 'hono';\n\nconst app = new Hono();\napp.get('/', (c) => c.text('hi'));", primary: 'hono', language: 'javascript' },
  { name: 'dotnet aspnet', code: 'var builder = WebApplication.CreateBuilder(args);\nvar app = builder.Build();\napp.MapGet("/", () => "hi");\napp.Run();', primary: 'dotnetcore', language: 'csharp' },

  // ── Styling ──
  { name: 'tailwind html', code: '<div class="flex items-center justify-between rounded-lg bg-white p-4 shadow-md">\n  <span class="text-sm font-medium text-gray-700">hi</span>\n</div>', primary: 'tailwindcss', language: 'html5' },
  { name: 'tailwind in react', code: "export function Card() {\n  return <div className=\"flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white\">hi</div>;\n}\nimport { useState } from 'react';\nconst [a, setA] = useState(0);", primary: 'react', language: 'javascript' },
  { name: 'bootstrap', code: '<div class="container">\n  <div class="row">\n    <div class="col-md-6"><button class="btn btn-primary">Go</button></div>\n  </div>\n</div>', primary: 'bootstrap', language: 'html5' },
  { name: 'styled-components', code: "import styled from 'styled-components';\n\nconst Btn = styled.button`\n  color: red;\n`;", primary: 'styledcomponents', language: 'javascript' },

  // ── DevOps / tools ──
  { name: 'dockerfile', code: 'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nEXPOSE 3000\nCMD ["node", "server.js"]', primary: 'docker', language: 'bash' },
  { name: 'docker compose', code: 'services:\n  web:\n    image: nginx:latest\n    ports:\n      - "80:80"\n  db:\n    image: postgres:16\n', primary: 'docker', language: 'yaml' },
  { name: 'kubernetes', code: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: web', primary: 'kubernetes', language: 'yaml' },
  { name: 'terraform', code: 'provider "aws" {\n  region = "us-east-1"\n}\n\nresource "aws_s3_bucket" "b" {\n  bucket = "my-bucket"\n}', primary: 'terraform', language: 'bash' },
  { name: 'github actions', code: 'name: CI\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test', primary: 'githubactions', language: 'yaml' },
  { name: 'git commands', code: 'git checkout -b feature/x\ngit add .\ngit commit -m "feat: x"\ngit push origin feature/x', primary: 'git', language: 'bash' },
  { name: 'npm commands', code: 'npm install --save-dev vitest\nnpm run build', primary: 'npm', language: 'bash' },
  { name: 'nginx', code: 'server {\n    listen 80;\n    server_name example.com;\n    location / {\n        proxy_pass http://localhost:3000;\n    }\n}', primary: 'nginx', language: 'bash' },
  { name: 'jest test', code: "describe('sum', () => {\n  it('adds', () => {\n    expect(sum(1, 2)).toBe(3);\n    jest.fn();\n  });\n});", primary: 'jest', language: 'javascript' },
  { name: 'vitest test', code: "import { describe, it, expect, vi } from 'vitest';\n\ndescribe('x', () => {\n  it('works', () => expect(1).toBe(1));\n});", primary: 'vitest', language: 'javascript' },
  { name: 'playwright', code: "import { test, expect } from '@playwright/test';\n\ntest('home', async ({ page }) => {\n  await page.goto('/');\n  await expect(page).toHaveTitle(/x/);\n});", primary: 'playwright', language: 'javascript' },
  { name: 'pytest', code: 'import pytest\n\n@pytest.fixture\ndef client():\n    return 1\n\ndef test_x(client):\n    assert client == 1', primary: 'pytest', language: 'python' },

  // ── Data / DB ──
  { name: 'postgres specific', code: 'CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  data JSONB,\n  created_at TIMESTAMPTZ DEFAULT now()\n);', primary: 'postgresql', language: 'sql' },
  { name: 'mysql specific', code: 'CREATE TABLE users (\n  id INT AUTO_INCREMENT PRIMARY KEY\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;', primary: 'mysql', language: 'sql' },
  { name: 'mongodb shell', code: "db.users.find({ age: { $gt: 18 } }).sort({ name: 1 });\ndb.users.aggregate([{ $match: { a: 1 } }]);", primary: 'mongodb', language: 'javascript' },
  { name: 'redis cli', code: 'SET session:1 "abc" EX 60\nGET session:1\nHSET user:1 name bob', primary: 'redis', language: 'bash' },
  { name: 'pandas', code: "import pandas as pd\n\ndf = pd.read_csv('a.csv')\nprint(df.groupby('x').mean())", primary: 'pandas', language: 'python' },
  { name: 'numpy', code: 'import numpy as np\n\na = np.array([1, 2, 3])\nprint(np.mean(a))', primary: 'numpy', language: 'python' },
  { name: 'pytorch', code: 'import torch\nimport torch.nn as nn\n\nclass Net(nn.Module):\n    def forward(self, x):\n        return x', primary: 'pytorch', language: 'python' },
  { name: 'graphql query', code: 'query GetUser($id: ID!) {\n  user(id: $id) {\n    name\n    posts { title }\n  }\n}', primary: 'graphql', language: 'graphql' },

  // ── Platforms / cloud ──
  { name: 'firebase', code: "import { initializeApp } from 'firebase/app';\nimport { getFirestore } from 'firebase/firestore';\n\nconst db = getFirestore(initializeApp(cfg));", primary: 'firebase', language: 'javascript' },
  { name: 'supabase', code: "import { createClient } from '@supabase/supabase-js';\n\nconst supabase = createClient(url, key);\nconst { data } = await supabase.from('users').select('*');", primary: 'supabase', language: 'javascript' },
  { name: 'aws cli', code: 'aws s3 cp ./a.txt s3://my-bucket/a.txt\naws lambda list-functions', primary: 'amazonwebservices', language: 'bash' },
  { name: 'electron', code: "const { app, BrowserWindow, ipcMain } = require('electron');\n\napp.whenReady().then(() => new BrowserWindow({ width: 800 }));", primary: 'electron', language: 'javascript' },
  { name: 'unity', code: 'using UnityEngine;\n\npublic class Player : MonoBehaviour {\n    void Update() {\n        transform.Translate(Vector3.forward);\n    }\n}', primary: 'unity', language: 'csharp' },
  { name: 'vite config', code: "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });", primary: 'vitejs', language: 'javascript' },

  // ── Known false-positive regressions ──
  { name: 'sql is not docker', code: 'SELECT * FROM images WHERE name = \'x\' AND from_date > now();', primary: 'sql', language: 'sql' },
  { name: 'java generics are not react', code: 'List<String> names = new ArrayList<>();\nMap<String, List<Integer>> m = new HashMap<>();\nnames.add("x");', primary: 'java', language: 'java' },
  { name: 'python is not typescript', code: 'class Foo:\n    def bar(self, x: int) -> str:\n        return str(x)', primary: 'python', language: 'python' },
  { name: 'css is not typescript', code: 'a:hover { color: red; }\n.btn { background: blue; }', primary: 'css3', language: 'css3' },

  // ── Docs pages (URL + prose, no code) ──
  { name: 'python docs', title: 'asyncio — Asynchronous I/O', url: 'https://docs.python.org/3/library/asyncio.html', body: 'asyncio is a library to write concurrent code using async/await syntax.', primary: 'python', language: 'python' },
  { name: 'rust docs', title: 'Ownership - The Rust Programming Language', url: 'https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html', body: 'Ownership is a set of rules that govern how a Rust program manages memory.', primary: 'rust', language: 'rust' },
  { name: 'docker docs', title: 'Dockerfile reference', url: 'https://docs.docker.com/reference/dockerfile/', body: 'Docker can build images automatically by reading the instructions from a Dockerfile.', primary: 'docker', language: 'bash' },
  { name: 'react docs', title: 'useEffect – React', url: 'https://react.dev/reference/react/useEffect', body: 'useEffect is a React Hook that lets you synchronize a component with an external system.', primary: 'react', language: 'javascript' },
  { name: 'tailwind docs', title: 'Flex - Tailwind CSS', url: 'https://tailwindcss.com/docs/flex', body: 'Utilities for controlling how flex items both grow and shrink.', primary: 'tailwindcss', language: 'css3' },
  { name: 'kubernetes docs', title: 'Pods | Kubernetes', url: 'https://kubernetes.io/docs/concepts/workloads/pods/', body: 'Pods are the smallest deployable units of computing that you can create and manage in Kubernetes.', primary: 'kubernetes', language: 'yaml' },
];

describe('detectTech corpus', () => {
  it.each(CASES)('$name', (testCase) => {
    const result = detectTech({
      code: testCase.code,
      body: testCase.body,
      title: testCase.title,
      url: testCase.url,
    });

    const debug = JSON.stringify({ c: result.candidates.slice(0, 4), l: result.languageScores });

    expect({ primary: result.primaryTech, language: result.language, debug }).toEqual({
      primary: testCase.primary,
      language: testCase.language,
      debug,
    });
  });
});

describe('AI hint blending', () => {
  it('keeps a more specific local stack over a generic AI answer', () => {
    const result = detectTech(
      { code: "const express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.send('ok'));" },
      { primaryTech: 'nodejs', language: 'javascript' },
    );

    expect(result.primaryTech).toBe('express');
  });

  it('uses the AI framework when the text has no signals', () => {
    const result = detectTech({ body: 'Notes about caching strategies' }, { primaryTech: 'django', language: 'python' });

    expect(result.primaryTech).toBe('django');
    expect(result.language).toBe('python');
  });

  it('survives a framework put in the language slot', () => {
    const result = detectTech({ code: 'x' }, { language: 'react' });

    expect(result.primaryTech).toBe('react');
  });

  it('accepts unknown AI slugs', () => {
    const result = detectTech({ body: 'misc notes' }, { primaryTech: 'livewire', language: 'php' });

    expect(result.primaryTech).toBe('livewire');
    expect(result.language).toBe('php');
  });
});

describe('catalog integrity', () => {
  it('has unique slugs', () => {
    const slugs = TECH_CATALOG.map((tech) => tech.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('resolves aliases', () => {
    expect(resolveTechSlug('Next.js')).toBe('nextjs');
    expect(resolveTechSlug('ts')).toBe('typescript');
    expect(resolveTechSlug('C++')).toBe('cplusplus');
    expect(resolveTechSlug('C#')).toBe('csharp');
    expect(resolveTechSlug('c')).toBe('c');
    expect(resolveTechSlug('Vue')).toBe('vuejs');
    expect(resolveTechSlug('k8s')).toBe('kubernetes');
    expect(resolveTechSlug('Tailwind CSS')).toBe('tailwindcss');
  });

  it('references only existing implied/base slugs', () => {
    const slugs = new Set(TECH_CATALOG.map((tech) => tech.slug));

    TECH_CATALOG.forEach((tech) => {
      tech.implies?.forEach((slug) => expect(slugs.has(slug), `${tech.slug} implies ${slug}`).toBe(true));

      if (tech.base) {
        expect(slugs.has(tech.base), `${tech.slug} base ${tech.base}`).toBe(true);
      }
    });
  });

  it('gives every tech a real icon or an abbreviation fallback', () => {
    const missing = TECH_CATALOG.filter(
      (tech) => !tech.iconUrls?.length && !DEVICON_VARIANTS[tech.icon ?? tech.slug],
    ).map((tech) => tech.slug);

    // Missing icons are fine (abbreviation tile), but they must have an abbreviation.
    missing.forEach((slug) => {
      const tech = TECH_CATALOG.find((entry) => entry.slug === slug);
      expect(tech?.abbr, `${slug} has no icon and no abbr`).toBeTruthy();
      expect(getDeviconUrlCandidates(slug)).toEqual([]);
    });
  });
});
