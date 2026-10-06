import {build} from 'vite';
import {writeFile} from 'node:fs/promises';
await build({configFile:false,publicDir:false,build:{outDir:'dist',emptyOutDir:false,target:'es2022',lib:{entry:'tests/mode-fixture.ts',formats:['es'],fileName:'mode-fixture'}}});
await writeFile('dist/mode-fixture.html','<!doctype html><title>Mode acceptance fixture</title><script type="module">import * as fixture from "/mode-fixture.js";window.fixture=fixture;window.fixtureReady=true;</script>');
