#!/usr/bin/env node
"use strict";

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const workingDir = process.cwd();
var program = require('commander');
var matter = require('gray-matter');
var fs = require('fs');
 
program
  .version('1.0.0')
  .usage('post <command> [post_name]')
  .option('draft <post_name>..<post_name>', 'create a draft post')
  .option('publish [post_name]', 'publish all drafts, or a single draft')
  .parse(process.argv);

if (program.publish) {
  console.log(program.publish);
}
else if (program.draft) {
  createDraft(program.draft);
}

function parseName(val) {
  return val
    .toLowerCase()
    .replace(/[^A-Za-z0-9_-]+/g, '-');
}

function createDraft(postName) {
  var fileName = parseName(postName);
  var path = `${workingDir}/_drafts/${fileName}.md`;

  var frontMatter = {
    layout: 'post',
    title: postName,
    slug: fileName
  };

  var stats = fs.stat(path, (err, stats) => {
    if (err) {
      writeFile(path, frontMatter);
    }
    else {
      rl.question(`File '${fileName}.md' already exists. Overwrite? (y/n) `, (answer) => {
        if (answer.toLowerCase() !== 'y') {
          exit(0);
        }
        else {
          writeFile(path, frontMatter);
        }
      });
    }
  });
}

function writeFile(path, frontMatter) {
  fs.writeFile(path, matter.stringify('', frontMatter),
    (err) => {
      if (err) {
          return console.log(err);
          exit(1);
      }

      console.log(`Post '${frontMatter.slug}.md' created.`);
      exit(0);
  });
}

function exit(status) {
  rl.close();
  process.exit(status);
}
