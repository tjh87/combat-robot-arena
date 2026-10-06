import {build} from 'vite';import {readFile,writeFile} from 'node:fs/promises';
const html=await readFile('dist/index.html','utf8'),styles=html.match(/<link[^>]*rel="stylesheet"[^>]*>/g)??[];
await build({configFile:false,publicDir:false,build:{outDir:'dist',emptyOutDir:false,target:'es2022',lib:{entry:'tests/follow-fixture.ts',formats:['es'],fileName:'follow-fixture'}}});
await writeFile('dist/follow-fixture.html','<!doctype html><html><head>'+styles.join('')+'</head><body><div id="fixture-root"></div><script type="module">import * as fixture from "/follow-fixture.js";window.fixture=fixture;window.fixtureReady=true;</script></body></html>');
