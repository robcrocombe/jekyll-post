#!/usr/bin/env node
"use strict";

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const draftDir = process.cwd() + '/_drafts';
const postDir = process.cwd() + '/_posts';
var program = require('commander');
var matter = require('gray-matter');
var moment = require('moment');
var fs = require('fs');
 
program
  .version('1.0.0')
  .usage('post <command> [post_name]')
  .option('draft <post_name>..<post_name>', 'create a draft post')
  .option('publish [post_name]', 'publish all drafts, or a single draft')
  .parse(process.argv);

if (program.publish) {
  var postName = program.publish;
  publishPost();
}
else if (program.draft) {
  var postName = program.draft;
  createDraft();
}

function parseName(val) {
  return val
    .toLowerCase()
    .replace(/[^A-Za-z0-9_-]+/g, '-');
}

function createDraft() {
  var fileName = parseName(postName);
  var path = `${draftDir}/${fileName}.md`;

  var frontMatter = {
    layout: 'post',
    title: postName,
    slug: fileName
  };

  if (fileExists(path)) {
    rl.question(`File '${path}' already exists. Overwrite? (y/n) `, (answer) => {
      if (answer.toLowerCase() !== 'y') {
        exit(0);
      }
      else {
        writeFileThenExit(path, fileName, frontMatter);
      }
    });
  }
  else {
    writeFileThenExit(path, fileName, frontMatter);
  }
}

function publishPost() {
  if (postName == true) {
    publishAllPosts();
  }
  else {
    publishSinglePost();
  }
}

function publishAllPosts() {
  fs.readdir(draftDir, (err, files) => {
    if (err) {
      return console.log(err);
      exit(1);
    }
    else {
      for (var file in files) {

      }
    }
  });
}

function publishSinglePost() {
  var fileName = parseName(postName);
  var path = `${draftDir}/${fileName}.md`;

  if (fileExists(path)) {
    var post = matter.read(path);
    var now = moment();
    post.data.date = getDateTime(now);

    var publishPath = `${postDir}/${getDateOnly(now)}-${fileName}.md`;
    writeFileThenExit(publishPath, fileName, post.data, post.content);
  }
  else {
    console.log(`File '${path}' doesn't exist.`);
    exit(1);
  }
}

function getDateTime(date) {
  return date.format('YYYY-MM-DD HH:mm:ssZ');
}

function getDateOnly(date) {
  return date.format('YYYY-MM-DD');
}

function fileExists(path) {
  try {
    fs.accessSync(path);
    return true;
  }
  catch {
    return false;
  }
}

function writeFile(path, name, frontMatter, content) {
  content = content || '';

  try {
    fs.writeFileSync(path, matter.stringify(content, frontMatter));
    console.log(`Post '${name}.md' created.`);
    return true;
  }
  catch(err) {
    console.log(err);
    return false;
  }
}

function writeFileThenExit(path, name, frontMatter, content) {
  if (writeFile(path, name, frontMatter, content)) {
    exit(0);
  }
  else {
    exit(1);
  }
}

function exit(status) {
  rl.close();
  process.exit(status);
}
